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
import type { ChatMessage, ConversationListItem } from '../../core/models/conversation.model'
import { AvatarComponent } from '../../shared/components/avatar/avatar.component'
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component'
import { TimeAgoPipe } from '../../shared/pipes/time-ago.pipe'
import { RelativeTimeService } from '../../core/services/relative-time.service'
import { NewConversationModalComponent } from './new-conversation-modal/new-conversation-modal.component'

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
    NewConversationModalComponent
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

  private typingTimeoutId?: ReturnType<typeof setTimeout>
  private typingClearTimeoutId?: ReturnType<typeof setTimeout>
  private pollingSubscription?: Subscription

  readonly messageForm = this.formBuilder.nonNullable.group({
    text: ['', [Validators.required, Validators.maxLength(2000)]]
  })

  ngOnInit(): void {
    void this.chatRealtime.connect().catch(() => undefined)
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
    void this.chatRealtime.setActiveConversation(null)
  }

  get visibleConversations(): ConversationListItem[] {
    const query = this.searchQuery.trim().toLowerCase()
    if (!query) {
      return this.conversations
    }

    return this.conversations.filter(conversation => {
      const displayName = this.getConversationDisplayName(conversation).toLowerCase()
      return displayName.includes(query) || conversation.otherUsername.toLowerCase().includes(query)
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
    if (!this.activeConversation || this.messageForm.invalid || this.sendingMessage) {
      return
    }

    const text = this.messageForm.controls.text.value.trim()
    if (!text) {
      return
    }

    this.sendingMessage = true
    this.sendError = ''
    void this.chatRealtime.notifyStoppedTyping(this.activeConversation.id)

    this.conversationService
      .sendMessage(this.activeConversation.id, text)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: message => {
          this.appendMessageIfMissing(message)
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

  getConversationDisplayName(conversation: ConversationListItem): string {
    return conversation.otherDisplayName ?? conversation.otherUsername
  }

  getPreviewText(conversation: ConversationListItem): string {
    if (!conversation.lastMessageText) {
      return 'Iniciar conversa'
    }

    const currentUserId = this.authService.getCurrentUser()?.id
    const isOwnPreview = conversation.lastMessageText.startsWith('Tu:')
    if (isOwnPreview) {
      return conversation.lastMessageText
    }

    return conversation.lastMessageText
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
          this.refreshConversationsSilently()
          return
        }

        this.appendMessageIfMissing(message)
        this.scrollMessagesToBottom()

        if (!message.isMine) {
          this.conversationService.markAsRead(this.activeConversation.id).subscribe()
        }
      })

    this.chatRealtime.typing$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(event => {
        if (!this.activeConversation || event.conversationId !== this.activeConversation.id) {
          return
        }

        const currentUserId = this.authService.getCurrentUser()?.id
        if (event.userId === currentUserId) {
          return
        }

        if (event.isTyping) {
          this.typingLabel = `${event.username} está a escrever…`
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

    void this.chatRealtime.setActiveConversation(conversation.id)

    this.conversationService
      .getMessages(conversation.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: messages => {
          this.messages = messages
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

  private appendMessageIfMissing(message: ChatMessage): void {
    if (this.messages.some(existing => existing.id === message.id)) {
      return
    }

    this.messages = [...this.messages, message]
    this.updateConversationPreview(message)
  }

  private updateConversationPreview(message: ChatMessage): void {
    if (!this.activeConversation) {
      return
    }

    const preview = message.isMine ? `Tu: ${message.text}` : message.text

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
}
