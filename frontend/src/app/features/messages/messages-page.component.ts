import { Component, DestroyRef, ElementRef, OnDestroy, OnInit, ViewChild, inject } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { CommonModule, DatePipe } from '@angular/common'
import { ActivatedRoute, Router, RouterModule } from '@angular/router'
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms'
import { HttpErrorResponse } from '@angular/common/http'
import { EMPTY, Subscription, debounceTime, distinctUntilChanged, interval, switchMap } from 'rxjs'
import { ConversationService } from '../../core/services/conversation.service'
import { ChatRealtimeService } from '../../core/services/chat-realtime.service'
import { AuthService } from '../../core/services/auth.service'
import type { ChatMessage, ConversationListItem, MessageReplyPreview } from '../../core/models/conversation.model'
import { AvatarComponent } from '../../shared/components/avatar/avatar.component'
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component'
import { TimeAgoPipe } from '../../shared/pipes/time-ago.pipe'
import { RelativeTimeService } from '../../core/services/relative-time.service'
import { NewConversationModalComponent } from './new-conversation-modal/new-conversation-modal.component'
import { ChatEmojiPickerComponent } from './chat-emoji-picker/chat-emoji-picker.component'

export interface MessageDayGroup {
  key: string
  label: string
  messages: ChatMessage[]
}

@Component({
  selector: 'app-messages-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    FormsModule,
    DatePipe,
    AvatarComponent,
    LoadingSpinnerComponent,
    TimeAgoPipe,
    NewConversationModalComponent,
    ChatEmojiPickerComponent
  ],
  templateUrl: './messages-page.component.html',
  styleUrl: './messages-page.component.scss'
})
export class MessagesPageComponent implements OnInit, OnDestroy {
  private readonly conversationService = inject(ConversationService)
  private readonly chatRealtime = inject(ChatRealtimeService)
  private readonly authService = inject(AuthService)
  private readonly route = inject(ActivatedRoute)
  private readonly router = inject(Router)
  private readonly destroyRef = inject(DestroyRef)
  private readonly formBuilder = inject(FormBuilder)
  readonly relativeTime = inject(RelativeTimeService)

  @ViewChild('messagesScroll') messagesScroll?: ElementRef<HTMLElement>

  conversations: ConversationListItem[] = []
  messages: ChatMessage[] = []
  activeConversation: ConversationListItem | null = null

  loadingConversations = true
  loadingMessages = false
  sendingMessage = false
  conversationsError = false
  messagesError = false
  sendError = ''
  searchQuery = ''
  typingLabel = ''
  realtimeConnected = false
  newConversationOpen = false
  pendingImage: File | null = null
  pendingImagePreview = ''
  pendingVideo: File | null = null
  pendingVideoPreview = ''
  remoteImageUrl = ''
  replyingTo: ChatMessage | null = null
  editingMessage: ChatMessage | null = null
  composerEmojiOpen = false
  reactionPickerMessageId: string | null = null
  actionMenuMessageId: string | null = null
  forwardingMessage: ChatMessage | null = null
  forwardingIds = new Set<string>()
  forwarding = false
  forwardError = ''
  loadingOlderMessages = false
  hasMoreMessages = true

  private typingTimeoutId?: ReturnType<typeof setTimeout>
  private typingClearTimeoutId?: ReturnType<typeof setTimeout>
  private longPressTimeoutId?: ReturnType<typeof setTimeout>
  private pollingSubscription?: Subscription

  readonly messageForm = this.formBuilder.nonNullable.group({
    text: ['', [Validators.maxLength(2000)]]
  })

  get canSendMessage(): boolean {
    const hasText = this.messageForm.controls.text.value.trim().length > 0
    const hasRemoteImage = this.remoteImageUrl.trim().length > 0
    return (hasText || !!this.pendingImage || !!this.pendingVideo || hasRemoteImage) && !this.sendingMessage
  }

  ngOnInit(): void {
    void this.chatRealtime.connect().catch(() => undefined)
    this.setupPushNotifications()
    this.loadConversations()
    this.setupRealtimeListeners()
    this.setupFallbackPolling()

    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const conversationId = params.get('conversationId')
      if (conversationId) {
        this.selectConversationById(conversationId)
      } else {
        this.activeConversation = null
        this.messages = []
        void this.chatRealtime.setActiveConversation(null)
      }
    })

    this.messageForm.controls.text.valueChanges
      .pipe(debounceTime(250), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.handleComposerInput())
  }

  ngOnDestroy(): void {
    this.pollingSubscription?.unsubscribe()
    this.clearPendingMedia()
    void this.chatRealtime.setActiveConversation(null)
  }

  get visibleConversations(): ConversationListItem[] {
    const query = this.searchQuery.trim().toLowerCase()
    if (!query) {
      return this.conversations
    }

    return this.conversations.filter(conversation => {
      const displayName = this.getConversationDisplayName(conversation).toLowerCase()
      const username = conversation.otherUsername?.toLowerCase() ?? ''
      return displayName.includes(query) || username.includes(query)
    })
  }

  get messageDayGroups(): MessageDayGroup[] {
    const groups = new Map<string, MessageDayGroup>()

    for (const message of this.messages) {
      const date = new Date(message.createdAt)
      const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
      const label = this.formatDayLabel(date)

      const existing = groups.get(key)
      if (existing) {
        existing.messages.push(message)
        continue
      }

      groups.set(key, { key, label, messages: [message] })
    }

    return Array.from(groups.values())
  }

  loadConversations(): void {
    this.loadingConversations = true
    this.conversationsError = false

    this.conversationService
      .getConversations()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: conversations => {
          this.conversations = conversations
          this.loadingConversations = false

          const conversationId = this.route.snapshot.paramMap.get('conversationId')
          if (conversationId) {
            this.selectConversationById(conversationId)
          }
        },
        error: () => {
          this.loadingConversations = false
          this.conversationsError = true
        }
      })
  }

  handleSelectConversation(conversation: ConversationListItem): void {
    void this.router.navigate(['/messages', conversation.id])
  }

  handleSendMessage(): void {
    if (!this.activeConversation || !this.canSendMessage) {
      return
    }

    const text = this.messageForm.controls.text.value.trim()
    const remoteImageUrl = this.remoteImageUrl.trim()
    if (!text && !this.pendingImage && !this.pendingVideo && !remoteImageUrl) {
      return
    }

    this.sendingMessage = true
    this.sendError = ''
    void this.chatRealtime.notifyStoppedTyping(this.activeConversation.id)

    const replyToMessageId = this.replyingTo?.id
    const hasMedia = !!this.pendingImage || !!this.pendingVideo
    const request$ = this.editingMessage
      ? this.conversationService.editMessage(this.activeConversation.id, this.editingMessage.id, text)
      : hasMedia
      ? this.conversationService.sendMessageWithMedia(this.activeConversation.id, {
          text,
          image: this.pendingImage ?? undefined,
          video: this.pendingVideo ?? undefined,
          replyToMessageId,
          remoteImageUrl: remoteImageUrl || undefined
        })
      : this.conversationService.sendMessage(
          this.activeConversation.id,
          text,
          replyToMessageId,
          remoteImageUrl || undefined
        )

    request$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: message => {
          this.clearPendingMedia()
          this.replyingTo = null
          this.editingMessage = null
          this.remoteImageUrl = ''
          this.composerEmojiOpen = false
          this.upsertMessage(message)
          this.messageForm.reset()
          this.sendingMessage = false
          this.updateConversationPreview(message)
          this.scrollMessagesToBottom()
        },
        error: (error: HttpErrorResponse) => {
          this.sendingMessage = false
          this.sendError = error.error?.message ?? 'Não foi possível enviar a mensagem.'
        }
      })
  }

  handleReplyToMessage(message: ChatMessage): void {
    this.replyingTo = message
    this.reactionPickerMessageId = null
    this.actionMenuMessageId = null
  }

  handleEditMessage(message: ChatMessage): void {
    if (!message.isMine) {
      return
    }

    this.editingMessage = message
    this.replyingTo = null
    this.messageForm.controls.text.setValue(message.text ?? '')
    this.actionMenuMessageId = null
  }

  handleCancelEdit(): void {
    this.editingMessage = null
    this.messageForm.controls.text.setValue('')
  }

  handleDeleteMessage(message: ChatMessage, scope: 'self' | 'everyone'): void {
    if (!this.activeConversation) {
      return
    }

    this.conversationService
      .deleteMessage(this.activeConversation.id, message.id, scope)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.actionMenuMessageId = null
          if (scope === 'self') {
            this.messages = this.messages.filter(existing => existing.id !== message.id)
            return
          }

          this.messages = this.messages.map(existing =>
            existing.id === message.id
              ? {
                  ...existing,
                  text: '',
                  imageUrl: undefined,
                  videoUrl: undefined,
                  remoteImageUrl: undefined,
                  isDeletedForEveryone: true
                }
              : existing
          )
        }
      })
  }

  handleOpenForwardModal(message: ChatMessage): void {
    this.forwardingMessage = message
    this.forwardingIds = new Set<string>()
    this.forwarding = false
    this.forwardError = ''
    this.actionMenuMessageId = null
  }

  handleToggleForwardConversation(conversationId: string): void {
    if (this.forwardingIds.has(conversationId)) {
      this.forwardingIds.delete(conversationId)
      return
    }

    this.forwardingIds.add(conversationId)
  }

  handleCloseForwardModal(): void {
    this.forwardingMessage = null
    this.forwardingIds = new Set<string>()
    this.forwarding = false
    this.forwardError = ''
  }

  handleConfirmForward(): void {
    if (!this.activeConversation || !this.forwardingMessage || this.forwarding || this.forwardingIds.size === 0) {
      return
    }

    this.forwarding = true
    this.forwardError = ''
    this.conversationService
      .forwardMessage(this.activeConversation.id, this.forwardingMessage.id, Array.from(this.forwardingIds))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.forwarding = false
          this.handleCloseForwardModal()
          this.loadConversations()
        },
        error: (error: HttpErrorResponse) => {
          this.forwarding = false
          this.forwardError = error.error?.message ?? 'Não foi possível encaminhar a mensagem.'
        }
      })
  }

  handleCancelReply(): void {
    this.replyingTo = null
  }

  handleOpenReactionPicker(messageId: string, event: MouseEvent): void {
    event.stopPropagation()
    this.reactionPickerMessageId = this.reactionPickerMessageId === messageId ? null : messageId
    this.composerEmojiOpen = false
    this.actionMenuMessageId = null
  }

  handleReactionSelected(message: ChatMessage, emoji: string): void {
    if (!this.activeConversation) {
      return
    }

    this.reactionPickerMessageId = null
    this.conversationService
      .toggleReaction(this.activeConversation.id, message.id, emoji)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: reactions => {
          this.messages = this.messages.map(existing =>
            existing.id === message.id ? { ...existing, reactions } : existing
          )
        }
      })
  }

  handleComposerEmojiSelected(emoji: string): void {
    const control = this.messageForm.controls.text
    control.setValue(`${control.value}${emoji}`)
    this.composerEmojiOpen = false
  }

  handleToggleComposerEmoji(): void {
    this.composerEmojiOpen = !this.composerEmojiOpen
    this.reactionPickerMessageId = null
  }

  getReplyPreviewLabel(reply: MessageReplyPreview | ChatMessage): string {
    if (reply.text?.trim()) {
      return reply.text.trim()
    }
    if (reply.videoUrl) {
      return 'Vídeo'
    }
    if (reply.imageUrl) {
      return reply.isGif ? 'GIF' : 'Imagem'
    }
    return 'Mensagem'
  }

  getReplyAuthorName(reply: MessageReplyPreview | ChatMessage): string {
    return reply.senderDisplayName ?? reply.senderUsername
  }

  handleImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    input.value = ''

    if (!file || !file.type.startsWith('image/')) {
      return
    }

    this.clearPendingMedia()
    this.pendingImage = file
    this.pendingImagePreview = URL.createObjectURL(file)
  }

  handleGifSelected(event: Event): void {
    this.handleImageSelected(event)
  }

  handleVideoSelected(event: Event): void {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    input.value = ''

    if (!file || !file.type.startsWith('video/')) {
      return
    }

    this.clearPendingMedia()
    this.pendingVideo = file
    this.pendingVideoPreview = URL.createObjectURL(file)
  }

  handleRemovePendingMedia(): void {
    this.clearPendingMedia()
  }

  handleComposerKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      this.handleSendMessage()
    }
  }

  handleBackToList(): void {
    void this.router.navigate(['/messages'])
  }

  handleOpenNewConversation(): void {
    this.newConversationOpen = true
  }

  handleCloseNewConversation(): void {
    this.newConversationOpen = false
  }

  handleConversationCreated(conversationId: string): void {
    this.newConversationOpen = false
    void this.router.navigate(['/messages', conversationId])
    this.loadConversations()
  }

  handleRetryMessages(): void {
    if (!this.activeConversation) {
      return
    }

    this.openConversation(this.activeConversation)
  }

  handleOpenActionsMenu(messageId: string, event?: MouseEvent): void {
    event?.stopPropagation()
    this.actionMenuMessageId = this.actionMenuMessageId === messageId ? null : messageId
    this.reactionPickerMessageId = null
  }

  handleMessageTouchStart(messageId: string): void {
    this.longPressTimeoutId = setTimeout(() => {
      this.actionMenuMessageId = messageId
    }, 500)
  }

  handleMessageTouchEnd(): void {
    if (!this.longPressTimeoutId) {
      return
    }

    clearTimeout(this.longPressTimeoutId)
    this.longPressTimeoutId = undefined
  }

  handleMessagesScroll(): void {
    const element = this.messagesScroll?.nativeElement
    if (!element || !this.activeConversation || this.loadingOlderMessages || !this.hasMoreMessages) {
      return
    }

    if (element.scrollTop > 90) {
      return
    }

    const firstMessage = this.messages[0]
    if (!firstMessage) {
      return
    }

    const previousHeight = element.scrollHeight
    this.loadingOlderMessages = true
    this.conversationService
      .getMessages(this.activeConversation.id, 50, firstMessage.createdAt)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: olderMessages => {
          this.loadingOlderMessages = false
          this.hasMoreMessages = olderMessages.length >= 50
          const unseen = olderMessages.filter(
            incoming => !this.messages.some(existing => existing.id === incoming.id)
          )
          this.messages = [...unseen, ...this.messages]

          requestAnimationFrame(() => {
            const nextElement = this.messagesScroll?.nativeElement
            if (!nextElement) {
              return
            }

            const heightDelta = nextElement.scrollHeight - previousHeight
            nextElement.scrollTop = nextElement.scrollTop + heightDelta
          })
        },
        error: () => {
          this.loadingOlderMessages = false
        }
      })
  }

  getConversationDisplayName(conversation: ConversationListItem): string {
    if (conversation.isGroup) {
      return conversation.title ?? 'Grupo'
    }

    return conversation.otherDisplayName ?? conversation.otherUsername ?? 'Conversa'
  }

  getPreviewText(conversation: ConversationListItem): string {
    if (!conversation.lastMessageText) {
      return 'Iniciar conversa'
    }
    const isOwnPreview = conversation.lastMessageText.startsWith('Tu:')
    if (isOwnPreview) {
      return conversation.lastMessageText
    }

    return conversation.lastMessageText
  }

  canEditForEveryone(message: ChatMessage): boolean {
    if (!message.isMine || message.isDeletedForEveryone) {
      return false
    }

    return Date.now() - new Date(message.createdAt).getTime() <= 15 * 60 * 1000
  }

  trackConversation(_index: number, conversation: ConversationListItem): string {
    return conversation.id
  }

  trackMessage(_index: number, message: ChatMessage): string {
    return message.id
  }

  trackDayGroup(_index: number, group: MessageDayGroup): string {
    return group.key
  }

  private setupRealtimeListeners(): void {
    this.chatRealtime.connected$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(connected => {
        this.realtimeConnected = connected
      })

    this.chatRealtime.message$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(message => {
        if (!this.activeConversation || message.conversationId !== this.activeConversation.id) {
          this.maybeNotifyIncomingMessage(message)
          this.refreshConversationsSilently()
          return
        }

        this.upsertMessage(message)
        this.scrollMessagesToBottom()

        if (!message.isMine) {
          this.conversationService.markAsRead(this.activeConversation.id).subscribe()
        }
      })

    this.chatRealtime.readReceipt$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(event => {
        if (!this.activeConversation || event.conversationId !== this.activeConversation.id) {
          return
        }

        const readerId = event.readerUserId.toLowerCase()
        if (!this.activeConversation.isGroup) {
          const otherId = this.activeConversation.otherUserId?.toLowerCase()
          if (!otherId || readerId !== otherId) {
            return
          }
        }

        const currentUserId = this.authService.getCurrentUser()?.id?.toLowerCase()
        if (readerId === currentUserId) {
          return
        }

        this.messages = this.messages.map(existing =>
          existing.isMine ? { ...existing, isRead: true } : existing
        )
      })

    this.chatRealtime.typing$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(event => {
        if (!this.activeConversation || event.conversationId !== this.activeConversation.id) {
          return
        }

        const currentUserId = this.authService.getCurrentUser()?.id?.toLowerCase()
        const eventUserId = event.userId.toLowerCase()

        if (!eventUserId || eventUserId === currentUserId) {
          return
        }

        if (!this.activeConversation.isGroup) {
          const otherUserId = this.activeConversation.otherUserId?.toLowerCase()
          if (!otherUserId || eventUserId !== otherUserId) {
            return
          }
        }

        if (!event.isTyping && this.activeConversation.isGroup) {
          this.typingLabel = ''
          return
        }

        if (event.isTyping) {
          this.typingLabel = `${this.getConversationDisplayName(this.activeConversation)} está a escrever…`
          if (this.typingClearTimeoutId) {
            clearTimeout(this.typingClearTimeoutId)
          }
          this.typingClearTimeoutId = setTimeout(() => {
            this.typingLabel = ''
          }, 2800)
          return
        }

        this.typingLabel = ''
      })

    this.chatRealtime.reactionChanged$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(event => {
        if (!this.activeConversation || event.conversationId !== this.activeConversation.id) {
          return
        }

        this.messages = this.messages.map(existing =>
          existing.id === event.messageId ? { ...existing, reactions: event.reactions } : existing
        )
      })

    this.chatRealtime.messageDeleted$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(event => {
        if (!this.activeConversation || event.conversationId !== this.activeConversation.id) {
          return
        }

        this.messages = this.messages.map(existing =>
          existing.id === event.messageId
            ? {
                ...existing,
                text: '',
                imageUrl: undefined,
                videoUrl: undefined,
                remoteImageUrl: undefined,
                isDeletedForEveryone: true
              }
            : existing
        )
      })

    this.chatRealtime.messageEdited$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(event => {
        if (!this.activeConversation || event.conversationId !== this.activeConversation.id) {
          return
        }

        this.upsertMessage(event.message)
      })
  }

  private setupFallbackPolling(): void {
    this.pollingSubscription = interval(12000)
      .pipe(
        switchMap(() => {
          if (this.realtimeConnected || !this.activeConversation) {
            return EMPTY
          }

          return this.conversationService.getMessages(this.activeConversation.id)
        })
      )
      .subscribe(messages => {
        if (!this.activeConversation) {
          return
        }

        this.messages = messages
      })
  }

  private handleComposerInput(): void {
    if (!this.activeConversation) {
      return
    }

    const hasText = this.messageForm.controls.text.value.trim().length > 0
    if (!hasText) {
      void this.chatRealtime.notifyStoppedTyping(this.activeConversation.id)
      return
    }

    if (this.typingTimeoutId) {
      clearTimeout(this.typingTimeoutId)
    }

    this.typingTimeoutId = setTimeout(() => {
      void this.chatRealtime.notifyTyping(this.activeConversation!.id)
    }, 200)
  }

  private selectConversationById(conversationId: string): void {
    const existing = this.conversations.find(conversation => conversation.id === conversationId)
    if (existing) {
      void this.openConversation(existing)
      return
    }

    if (this.loadingConversations) {
      return
    }

    this.activeConversation = null
    this.messages = []
  }

  private openConversation(conversation: ConversationListItem): void {
    if (this.activeConversation?.id === conversation.id && !this.loadingMessages) {
      return
    }

    const unreadBeforeRead = conversation.unreadCount
    this.activeConversation = conversation
    this.loadingMessages = true
    this.messagesError = false
    this.sendError = ''
    this.typingLabel = ''
    this.replyingTo = null
    this.editingMessage = null
    this.reactionPickerMessageId = null
    this.actionMenuMessageId = null
    this.composerEmojiOpen = false
    this.hasMoreMessages = true

    void this.chatRealtime.setActiveConversation(conversation.id)

    this.conversationService
      .getMessages(conversation.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: messages => {
          this.messages = messages
          this.hasMoreMessages = messages.length >= 50
          this.loadingMessages = false
          this.messagesError = false
          this.scrollMessagesToBottom()
        },
        error: () => {
          this.loadingMessages = false
          this.messagesError = true
        }
      })

    if (unreadBeforeRead > 0) {
      this.conversationService
        .markAsRead(conversation.id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            conversation.unreadCount = 0
            this.conversationService.decrementUnreadLocally(unreadBeforeRead)
            this.conversationService.refreshUnreadCount().subscribe()
          }
        })
    }
  }

  private upsertMessage(message: ChatMessage): void {
    const existingIndex = this.messages.findIndex(existing => existing.id === message.id)
    if (existingIndex === -1) {
      this.messages = [...this.messages, message]
      this.updateConversationPreview(message)
      return
    }

    this.messages = this.messages.map(existing => (existing.id === message.id ? { ...existing, ...message } : existing))
  }

  private updateConversationPreview(message: ChatMessage): void {
    if (!this.activeConversation) {
      return
    }

    const mediaLabel = message.videoUrl
      ? 'Vídeo'
      : message.imageUrl
        ? message.isGif
          ? 'GIF'
          : 'Imagem'
        : ''
    const replyPrefix = message.replyTo ? '↩ ' : ''
    const content = message.text || mediaLabel || 'Mensagem'
    const preview = message.isMine ? `Tu: ${replyPrefix}${content}` : `${replyPrefix}${content}`

    this.activeConversation = {
      ...this.activeConversation,
      lastMessageText: preview,
      lastMessageAt: message.createdAt
    }

    this.conversations = this.conversations
      .map(conversation =>
        conversation.id === this.activeConversation?.id
          ? {
              ...conversation,
              lastMessageText: preview,
              lastMessageAt: message.createdAt
            }
          : conversation
      )
      .sort((left, right) => {
        const leftTime = left.lastMessageAt ? new Date(left.lastMessageAt).getTime() : 0
        const rightTime = right.lastMessageAt ? new Date(right.lastMessageAt).getTime() : 0
        return rightTime - leftTime
      })
  }

  private refreshConversationsSilently(): void {
    this.conversationService
      .getConversations()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(conversations => {
        this.conversations = conversations
        this.conversationService.refreshUnreadCount().subscribe()
      })
  }

  private formatDayLabel(date: Date): string {
    const today = new Date()
    const yesterday = new Date()
    yesterday.setDate(today.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Hoje'
    }

    if (date.toDateString() === yesterday.toDateString()) {
      return 'Ontem'
    }

    return date.toLocaleDateString('pt-PT', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
    })
  }

  private scrollMessagesToBottom(): void {
    requestAnimationFrame(() => {
      const element = this.messagesScroll?.nativeElement
      if (!element) {
        return
      }

      element.scrollTop = element.scrollHeight
    })
  }

  private clearPendingMedia(): void {
    if (this.pendingImagePreview) {
      URL.revokeObjectURL(this.pendingImagePreview)
    }
    if (this.pendingVideoPreview) {
      URL.revokeObjectURL(this.pendingVideoPreview)
    }
    this.pendingImage = null
    this.pendingImagePreview = ''
    this.pendingVideo = null
    this.pendingVideoPreview = ''
  }

  private setupPushNotifications(): void {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return
    }

    if (Notification.permission === 'default') {
      void Notification.requestPermission()
    }
  }

  private maybeNotifyIncomingMessage(message: ChatMessage): void {
    if (message.isMine) {
      return
    }

    const isActiveConversation = this.activeConversation?.id === message.conversationId
    if (isActiveConversation && document.hasFocus()) {
      return
    }

    if (Notification.permission !== 'granted') {
      return
    }

    const conversation = this.conversations.find(item => item.id === message.conversationId)
    const title = conversation
      ? this.getConversationDisplayName(conversation)
      : 'Nova mensagem'
    const body = message.text?.trim()
      || (message.videoUrl ? 'Enviou um vídeo' : '')
      || (message.imageUrl ? (message.isGif ? 'Enviou um GIF' : 'Enviou uma imagem') : '')
      || 'Nova mensagem'

    new Notification(title, {
      body,
      icon: '/nzolanet-logo.png',
      tag: `nzolanet-msg-${message.conversationId}`
    })
  }
}
