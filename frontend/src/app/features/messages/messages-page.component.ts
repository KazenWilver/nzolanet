import { Component, DestroyRef, ElementRef, OnDestroy, OnInit, ViewChild, inject } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { CommonModule, DatePipe } from '@angular/common'
import { ActivatedRoute, Router, RouterModule } from '@angular/router'
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms'
import { HttpErrorResponse } from '@angular/common/http'
import { EMPTY, Subscription, debounceTime, distinctUntilChanged, interval, switchMap } from 'rxjs'
import gsap from 'gsap'
import { ConversationService } from '../../core/services/conversation.service'
import { ChatRealtimeService } from '../../core/services/chat-realtime.service'
import { AuthService } from '../../core/services/auth.service'
import { AnimationService } from '../../core/services/animation.service'
import type { ChatMessage, ConversationDetail, ConversationListItem, MessageReadStatus, MessageReplyPreview } from '../../core/models/conversation.model'
import { AvatarComponent } from '../../shared/components/avatar/avatar.component'
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component'
import { TimeAgoPipe } from '../../shared/pipes/time-ago.pipe'
import { RelativeTimeService } from '../../core/services/relative-time.service'
import { NewConversationModalComponent } from './new-conversation-modal/new-conversation-modal.component'
import { GroupInfoModalComponent } from './group-info-modal/group-info-modal.component'
import { ChatEmojiPickerComponent } from './chat-emoji-picker/chat-emoji-picker.component'
import { MentionAutocompleteDirective } from '../../shared/directives/mention-autocomplete.directive'
import { LinkifyTextPipe } from '../../shared/pipes/linkify-text.pipe'
import { TPipe } from '../../core/i18n/translate.pipe'
import { LocaleService } from '../../core/i18n/locale.service'
import { resolveMediaDownloadUrl } from '../../core/helpers/media-url.helper'

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
    GroupInfoModalComponent,
    ChatEmojiPickerComponent,
    MentionAutocompleteDirective,
    LinkifyTextPipe,
    TPipe
  ],
  templateUrl: './messages-page.component.html',
  styleUrl: './messages-page.component.scss'
})
export class MessagesPageComponent implements OnInit, OnDestroy {
  private readonly conversationService = inject(ConversationService)
  private readonly chatRealtime = inject(ChatRealtimeService)
  private readonly authService = inject(AuthService)
  private readonly animationService = inject(AnimationService)
  private readonly route = inject(ActivatedRoute)
  private readonly router = inject(Router)
  private readonly destroyRef = inject(DestroyRef)
  private readonly formBuilder = inject(FormBuilder)
  readonly relativeTime = inject(RelativeTimeService)
  private readonly localeService = inject(LocaleService)

  @ViewChild('messagesScroll') messagesScroll?: ElementRef<HTMLElement>
  @ViewChild('typingIndicator') typingIndicator?: ElementRef<HTMLElement>

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
  groupInfoOpen = false
  pendingImage: File | null = null
  pendingImagePreview = ''
  pendingVideo: File | null = null
  pendingVideoPreview = ''
  pendingDocument: File | null = null
  pendingDocumentName = ''
  pendingAudio: File | null = null
  pendingAudioPreview = ''
  composerAttachOpen = false
  isRecording = false
  recordingSeconds = 0
  replyingTo: ChatMessage | null = null
  editingMessage: ChatMessage | null = null
  composerEmojiOpen = false
  reactionPickerMessageId: string | null = null
  actionMenuMessageId: string | null = null
  forwardingMessage: ChatMessage | null = null
  forwardingIds = new Set<string>()
  forwarding = false
  forwardError = ''
  forwardCaption = ''
  lightboxMedia: { url: string; type: 'image' | 'video' | 'audio'; isGif?: boolean; fileName?: string } | null = null
  loadingOlderMessages = false
  hasMoreMessages = true

  private mediaRecorder: MediaRecorder | null = null
  private recordingStream: MediaStream | null = null
  private recordingIntervalId?: ReturnType<typeof setInterval>
  private audioChunks: Blob[] = []
  private readonly audioPlayers = new Map<string, HTMLAudioElement>()
  playingAudioId: string | null = null

  private typingTimeoutId?: ReturnType<typeof setTimeout>
  private typingClearTimeoutId?: ReturnType<typeof setTimeout>
  private longPressTimeoutId?: ReturnType<typeof setTimeout>
  private pollingSubscription?: Subscription

  readonly messageForm = this.formBuilder.nonNullable.group({
    text: ['', [Validators.maxLength(2000)]]
  })

  get canSendMessage(): boolean {
    const hasText = this.messageForm.controls.text.value.trim().length > 0
    return (
      (hasText ||
        !!this.pendingImage ||
        !!this.pendingVideo ||
        !!this.pendingDocument ||
        !!this.pendingAudio) &&
      !this.sendingMessage &&
      !this.isRecording
    )
  }

  get hasPendingMedia(): boolean {
    return !!(
      this.pendingImagePreview ||
      this.pendingVideoPreview ||
      this.pendingDocument ||
      this.pendingAudioPreview
    )
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
    this.handleCancelRecording()
    this.audioPlayers.forEach(player => {
      player.pause()
    })
    this.audioPlayers.clear()
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
    if (!text && !this.pendingImage && !this.pendingVideo && !this.pendingDocument && !this.pendingAudio) {
      return
    }

    this.sendingMessage = true
    this.sendError = ''
    void this.chatRealtime.notifyStoppedTyping(this.activeConversation.id)

    const replyToMessageId = this.replyingTo?.id
    const hasMedia =
      !!this.pendingImage || !!this.pendingVideo || !!this.pendingDocument || !!this.pendingAudio
    const request$ = this.editingMessage
      ? this.conversationService.editMessage(this.activeConversation.id, this.editingMessage.id, text)
      : hasMedia
      ? this.conversationService.sendMessageWithMedia(this.activeConversation.id, {
          text,
          image: this.pendingImage ?? undefined,
          video: this.pendingVideo ?? undefined,
          document: this.pendingDocument ?? undefined,
          audio: this.pendingAudio ?? undefined,
          replyToMessageId
        })
      : this.conversationService.sendMessage(
          this.activeConversation.id,
          text,
          replyToMessageId
        )

    request$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: message => {
          this.clearPendingMedia()
          this.replyingTo = null
          this.editingMessage = null
          this.composerEmojiOpen = false
          this.upsertMessage(message)
          this.messageForm.reset()
          this.sendingMessage = false
          this.updateConversationPreview(message)
          this.scrollMessagesToBottom()
          this.animateMessageBubble(message.id)
        },
        error: (error: HttpErrorResponse) => {
          this.sendingMessage = false
          this.sendError = error.error?.message ?? this.localeService.translate('errors.generic')
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
                  audioUrl: undefined,
                  documentUrl: undefined,
                  documentFileName: undefined,
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
    this.forwardCaption = ''
    this.actionMenuMessageId = null
    requestAnimationFrame(() => {
      const overlay = document.querySelector('.messages-page__forward-overlay')
      const dialog = document.querySelector('.messages-page__forward-modal')
      if (overlay && dialog) {
        this.animationService.modalEnter(overlay, dialog)
      }
      const items = document.querySelectorAll('.messages-page__forward-item')
      if (items.length > 0) {
        this.animationService.staggerEnter(Array.from(items), 'fadeUp', 0.04)
      }
    })
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
    this.forwardCaption = ''
  }

  handleConfirmForward(): void {
    if (!this.activeConversation || !this.forwardingMessage || this.forwarding || this.forwardingIds.size === 0) {
      return
    }

    this.forwarding = true
    this.forwardError = ''
    this.conversationService
      .forwardMessage(
        this.activeConversation.id,
        this.forwardingMessage.id,
        Array.from(this.forwardingIds),
        this.forwardCaption
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.forwarding = false
          this.handleCloseForwardModal()
          this.loadConversations()
        },
        error: (error: HttpErrorResponse) => {
          this.forwarding = false
          this.forwardError = error.error?.message ?? this.localeService.translate('errors.generic')
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
    if (this.reactionPickerMessageId) {
      requestAnimationFrame(() => {
        const picker = document.querySelector('.messages-page__reaction-picker')
        if (picker) {
          this.animationService.dropdownIn(picker)
        }
      })
    }
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
    return this.localeService.translate('chat.sendMessage')
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
    this.composerAttachOpen = false
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
    this.composerAttachOpen = false
  }

  handleDocumentSelected(event: Event): void {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    input.value = ''

    if (!file) {
      return
    }

    this.clearPendingMedia()
    this.pendingDocument = file
    this.pendingDocumentName = file.name
    this.composerAttachOpen = false
  }

  handleToggleAttachMenu(): void {
    this.composerAttachOpen = !this.composerAttachOpen
  }

  handleCloseAttachMenu(): void {
    this.composerAttachOpen = false
  }

  async handleStartRecording(): Promise<void> {
    if (this.isRecording || !navigator.mediaDevices?.getUserMedia) {
      return
    }

    try {
      this.recordingStream = await navigator.mediaDevices.getUserMedia({ audio: true })
      this.audioChunks = []
      this.mediaRecorder = new MediaRecorder(this.recordingStream)
      this.mediaRecorder.ondataavailable = event => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data)
        }
      }
      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.audioChunks, { type: 'audio/webm' })
        this.clearPendingMedia()
        this.pendingAudio = new File([blob], `audio-${Date.now()}.webm`, { type: 'audio/webm' })
        this.pendingAudioPreview = URL.createObjectURL(blob)
        this.stopRecordingTracks()
      }
      this.mediaRecorder.start()
      this.isRecording = true
      this.recordingSeconds = 0
      this.composerAttachOpen = false
      this.recordingIntervalId = setInterval(() => {
        this.recordingSeconds += 1
      }, 1000)
    } catch {
      this.sendError = 'Não foi possível aceder ao microfone.'
    }
  }

  handleStopRecording(): void {
    if (!this.isRecording || !this.mediaRecorder) {
      return
    }

    this.mediaRecorder.stop()
    this.isRecording = false
    if (this.recordingIntervalId) {
      clearInterval(this.recordingIntervalId)
      this.recordingIntervalId = undefined
    }
  }

  handleCancelRecording(): void {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.onstop = null
      this.mediaRecorder.stop()
    }

    this.isRecording = false
    this.audioChunks = []
    if (this.recordingIntervalId) {
      clearInterval(this.recordingIntervalId)
      this.recordingIntervalId = undefined
    }
    this.stopRecordingTracks()
  }

  private stopRecordingTracks(): void {
    this.recordingStream?.getTracks().forEach(track => track.stop())
    this.recordingStream = null
    this.mediaRecorder = null
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

  handleOpenGroupInfo(): void {
    if (!this.activeConversation?.isGroup) {
      return
    }

    this.groupInfoOpen = true
  }

  handleCloseGroupInfo(): void {
    this.groupInfoOpen = false
  }

  handleGroupInfoUpdated(detail: ConversationDetail): void {
    this.applyConversationUpdate(detail)
    this.activeConversation = detail
  }

  handleOpenMediaLightbox(
    url: string,
    type: 'image' | 'video' | 'audio',
    isGif = false,
    fileName?: string
  ): void {
    this.lightboxMedia = { url, type, isGif, fileName }
    requestAnimationFrame(() => {
      const overlay = document.querySelector('.messages-page__lightbox-overlay')
      const content = document.querySelector('.messages-page__lightbox-content')
      if (overlay && content) {
        this.animationService.mediaLightboxEnter(overlay, content)
      }
    })
  }

  handleOpenDocument(url: string): void {
    if (!url) {
      return
    }

    window.open(url, '_blank', 'noopener,noreferrer')
  }

  handleDownloadDocument(url: string, fileName?: string): void {
    const downloadUrl = resolveMediaDownloadUrl(url, fileName)
    if (!downloadUrl) {
      return
    }

    const anchor = document.createElement('a')
    anchor.href = downloadUrl
    anchor.rel = 'noopener noreferrer'
    if (fileName?.trim()) {
      anchor.download = fileName.trim()
    }
    anchor.click()
  }

  handleToggleAudioPlayback(messageId: string, url: string): void {
    if (this.playingAudioId && this.playingAudioId !== messageId) {
      const current = this.audioPlayers.get(this.playingAudioId)
      current?.pause()
    }

    let audio = this.audioPlayers.get(messageId)
    if (!audio) {
      audio = new Audio(url)
      audio.addEventListener('ended', () => {
        if (this.playingAudioId === messageId) {
          this.playingAudioId = null
        }
      })
      this.audioPlayers.set(messageId, audio)
    }

    if (this.playingAudioId === messageId && !audio.paused) {
      audio.pause()
      this.playingAudioId = null
      return
    }

    void audio.play().then(() => {
      this.playingAudioId = messageId
    }).catch(() => undefined)
  }

  isAudioPlaying(messageId: string): boolean {
    return this.playingAudioId === messageId
  }

  handleCloseMediaLightbox(): void {
    this.lightboxMedia = null
  }

  getPresenceLabel(conversation: ConversationListItem): string {
    if (conversation.isGroup) {
      return `${conversation.participantCount} participantes`
    }

    if (conversation.otherUserIsOnline) {
      return 'Online'
    }

    if (conversation.otherUserLastSeenAt) {
      const lastSeen = new Date(conversation.otherUserLastSeenAt)
      const diffMs = Date.now() - lastSeen.getTime()
      const diffMinutes = Math.floor(diffMs / 60000)

      if (diffMinutes < 1) {
        return 'Visto há instantes'
      }
      if (diffMinutes < 60) {
        return `Visto há ${diffMinutes} min`
      }

      const diffHours = Math.floor(diffMinutes / 60)
      if (diffHours < 24) {
        return `Visto há ${diffHours}h`
      }

      return `Visto ${lastSeen.toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' })}`
    }

    return conversation.otherUsername ? `@${conversation.otherUsername}` : ''
  }

  getReadStatusLabel(status?: MessageReadStatus): string {
    if (status === 'read') {
      return 'Lida'
    }
    if (status === 'delivered') {
      return 'Entregue'
    }
    return 'Enviada'
  }

  getReadStatusSymbol(status?: MessageReadStatus): string {
    if (status === 'delivered' || status === 'read') {
      return '✓✓'
    }
    return '✓'
  }

  getConversationAvatar(conversation: ConversationListItem): string | undefined {
    if (conversation.isGroup) {
      return conversation.imageUrl
    }

    return conversation.otherPhotoUrl
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
        this.animateMessageBubble(message.id)

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
          existing.isMine
            ? { ...existing, isRead: true, readStatus: 'read' as MessageReadStatus }
            : existing
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
          this.animateTypingIndicator()
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

    this.chatRealtime.presence$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(event => {
        if (!this.activeConversation || event.conversationId !== this.activeConversation.id) {
          return
        }

        const otherUserId = this.activeConversation.otherUserId?.toLowerCase()
        if (!otherUserId || event.userId.toLowerCase() !== otherUserId) {
          return
        }

        this.activeConversation = {
          ...this.activeConversation,
          otherUserIsOnline: event.isOnline,
          otherUserLastSeenAt: event.lastSeenAt ?? this.activeConversation.otherUserLastSeenAt
        }

        this.conversations = this.conversations.map(conversation =>
          conversation.id === this.activeConversation?.id
            ? {
                ...conversation,
                otherUserIsOnline: event.isOnline,
                otherUserLastSeenAt: event.lastSeenAt ?? conversation.otherUserLastSeenAt
              }
            : conversation
        )
      })
  }

  private animateMessageBubble(messageId: string): void {
    if (!this.animationService.isEnabled) {
      return
    }

    requestAnimationFrame(() => {
      const bubble = document.querySelector(`[data-message-id="${messageId}"]`)
      if (!bubble) {
        return
      }

      gsap.fromTo(
        bubble,
        { opacity: 0, y: 12, scale: 0.96 },
        { opacity: 1, y: 0, scale: 1, duration: 0.32, ease: 'power2.out', clearProps: 'transform,opacity' }
      )
    })
  }

  private animateTypingIndicator(): void {
    if (!this.animationService.isEnabled) {
      return
    }

    requestAnimationFrame(() => {
      const element = this.typingIndicator?.nativeElement
      if (!element) {
        return
      }

      gsap.fromTo(
        element,
        { opacity: 0.4 },
        { opacity: 1, duration: 0.6, ease: 'sine.inOut', yoyo: true, repeat: 2 }
      )
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

    this.conversationService
      .getConversation(conversationId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: detail => {
          this.applyConversationUpdate(detail)
          void this.openConversation(detail)
        },
        error: () => {
          if (!this.loadingConversations) {
            this.activeConversation = null
            this.messages = []
          }
        }
      })
  }

  private applyConversationUpdate(conversation: ConversationListItem): void {
    const existingIndex = this.conversations.findIndex(item => item.id === conversation.id)
    if (existingIndex === -1) {
      this.conversations = [conversation, ...this.conversations]
      return
    }

    this.conversations = this.conversations.map(item =>
      item.id === conversation.id ? { ...item, ...conversation } : item
    )
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
    if (this.pendingAudioPreview) {
      URL.revokeObjectURL(this.pendingAudioPreview)
    }
    this.pendingImage = null
    this.pendingImagePreview = ''
    this.pendingVideo = null
    this.pendingVideoPreview = ''
    this.pendingDocument = null
    this.pendingDocumentName = ''
    this.pendingAudio = null
    this.pendingAudioPreview = ''
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
