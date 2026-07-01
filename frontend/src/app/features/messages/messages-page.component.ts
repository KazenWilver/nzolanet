import { Component, DestroyRef, ElementRef, OnInit, ViewChild, inject } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { CommonModule } from '@angular/common'
import { ActivatedRoute, Router, RouterModule } from '@angular/router'
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'
import { HttpErrorResponse } from '@angular/common/http'
import { EMPTY, interval, switchMap } from 'rxjs'
import { ConversationService } from '../../core/services/conversation.service'
import type { ChatMessage, ConversationListItem } from '../../core/models/conversation.model'
import { AvatarComponent } from '../../shared/components/avatar/avatar.component'
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component'
import { TimeAgoPipe } from '../../shared/pipes/time-ago.pipe'
import { RelativeTimeService } from '../../core/services/relative-time.service'

@Component({
  selector: 'app-messages-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    AvatarComponent,
    LoadingSpinnerComponent,
    TimeAgoPipe
  ],
  templateUrl: './messages-page.component.html',
  styleUrl: './messages-page.component.scss'
})
export class MessagesPageComponent implements OnInit {
  private readonly conversationService = inject(ConversationService)
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

  readonly messageForm = this.formBuilder.nonNullable.group({
    text: ['', [Validators.required, Validators.maxLength(2000)]]
  })

  ngOnInit(): void {
    this.loadConversations()

    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const conversationId = params.get('conversationId')
      if (conversationId) {
        this.selectConversationById(conversationId)
      } else {
        this.activeConversation = null
        this.messages = []
      }
    })

    interval(4000)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap(() => {
          if (!this.activeConversation) {
            return EMPTY
          }

          return this.conversationService.getMessages(this.activeConversation.id)
        })
      )
      .subscribe({
        next: messages => {
          if (!this.activeConversation) {
            return
          }

          this.messages = messages
        }
      })
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

    this.conversationService
      .sendMessage(this.activeConversation.id, text)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: message => {
          this.messages = [...this.messages, message]
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

  getConversationDisplayName(conversation: ConversationListItem): string {
    return conversation.otherDisplayName ?? conversation.otherUsername
  }

  trackConversation(_index: number, conversation: ConversationListItem): string {
    return conversation.id
  }

  trackMessage(_index: number, message: ChatMessage): string {
    return message.id
  }

  private selectConversationById(conversationId: string): void {
    const existing = this.conversations.find(conversation => conversation.id === conversationId)
    if (existing) {
      this.openConversation(existing)
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

    this.conversationService
      .getMessages(conversation.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: messages => {
          this.messages = messages
          this.loadingMessages = false
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

  private updateConversationPreview(message: ChatMessage): void {
    if (!this.activeConversation) {
      return
    }

    this.activeConversation = {
      ...this.activeConversation,
      lastMessageText: message.text,
      lastMessageAt: message.createdAt
    }

    this.conversations = this.conversations
      .map(conversation =>
        conversation.id === this.activeConversation?.id
          ? {
              ...conversation,
              lastMessageText: message.text,
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
