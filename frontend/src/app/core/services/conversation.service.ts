import { Injectable, inject } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { BehaviorSubject, Observable, Subscription, interval, of } from 'rxjs'
import { catchError, distinctUntilChanged, map, switchMap, tap } from 'rxjs/operators'
import { environment } from '../../../environments/environment'
import { AuthService } from './auth.service'
import type {
  BackendConversationDetailDto,
  BackendConversationListItemDto,
  BackendMessageDto,
  BackendMessageReactionSummaryDto,
  ChatMessage,
  ConversationDetail,
  ConversationListItem,
  MessageReactionSummary,
  UnreadMessagesCountResponse
} from '../models/conversation.model'
import { mapChatMessage, mapConversationDetail, mapConversationListItem } from '../models/conversation.model'

export interface UpdateGroupPayload {
  title?: string
  description?: string
}

export interface SendMediaOptions {
  text?: string
  image?: File
  video?: File
  document?: File
  audio?: File
  replyToMessageId?: string
  remoteImageUrl?: string
}

export interface CreateGroupConversationPayload {
  title: string
  participantIds: string[]
}

@Injectable({ providedIn: 'root' })
export class ConversationService {
  private readonly http = inject(HttpClient)
  private readonly authService = inject(AuthService)

  private readonly baseUrl = `${environment.apiUrl}/conversations`
  private readonly unreadCountSubject = new BehaviorSubject<number>(0)
  private pollingSubscription?: Subscription

  readonly unreadCount$ = this.unreadCountSubject.asObservable()

  constructor() {
    this.authService.currentUser$
      .pipe(distinctUntilChanged((previous, current) => previous?.id === current?.id))
      .subscribe(user => {
        this.pollingSubscription?.unsubscribe()

        if (!user) {
          this.unreadCountSubject.next(0)
          return
        }

        this.refreshUnreadCount().subscribe()

        this.pollingSubscription = interval(5000)
          .pipe(switchMap(() => this.fetchUnreadCount()))
          .subscribe(count => this.unreadCountSubject.next(count))
      })
  }

  getConversations(): Observable<ConversationListItem[]> {
    return this.http
      .get<BackendConversationListItemDto[]>(this.baseUrl)
      .pipe(map(items => items.map(mapConversationListItem)))
  }

  getOrCreateConversation(participantId: string): Observable<ConversationListItem> {
    return this.http
      .post<BackendConversationListItemDto>(this.baseUrl, { participantId })
      .pipe(map(mapConversationListItem))
  }

  createGroupConversation(payload: CreateGroupConversationPayload): Observable<ConversationListItem> {
    return this.http
      .post<BackendConversationListItemDto>(`${this.baseUrl}/group`, payload)
      .pipe(map(mapConversationListItem))
  }

  getConversation(conversationId: string): Observable<ConversationDetail> {
    return this.http
      .get<BackendConversationDetailDto>(`${this.baseUrl}/${conversationId}`)
      .pipe(map(mapConversationDetail))
  }

  addGroupParticipants(conversationId: string, participantIds: string[]): Observable<ConversationDetail> {
    return this.http
      .post<BackendConversationDetailDto>(`${this.baseUrl}/${conversationId}/participants`, {
        participantIds
      })
      .pipe(map(mapConversationDetail))
  }

  updateGroup(
    conversationId: string,
    payload: UpdateGroupPayload,
    image?: File
  ): Observable<ConversationDetail> {
    const formData = new FormData()
    if (payload.title?.trim()) {
      formData.append('title', payload.title.trim())
    }
    if (payload.description !== undefined) {
      formData.append('description', payload.description.trim())
    }
    if (image) {
      formData.append('image', image)
    }

    return this.http
      .patch<BackendConversationDetailDto>(`${this.baseUrl}/${conversationId}/group`, formData)
      .pipe(map(mapConversationDetail))
  }

  getMessages(conversationId: string, limit = 50, before?: string): Observable<ChatMessage[]> {
    const params: Record<string, string> = { limit: String(limit) }
    if (before) {
      params['before'] = before
    }

    return this.http
      .get<BackendMessageDto[]>(`${this.baseUrl}/${conversationId}/messages`, { params })
      .pipe(map(messages => messages.map(mapChatMessage)))
  }

  sendMessage(
    conversationId: string,
    text: string,
    replyToMessageId?: string,
    remoteImageUrl?: string
  ): Observable<ChatMessage> {
    return this.http
      .post<BackendMessageDto>(`${this.baseUrl}/${conversationId}/messages`, {
        text,
        replyToMessageId: replyToMessageId ?? null,
        remoteImageUrl: remoteImageUrl?.trim() || null
      })
      .pipe(map(mapChatMessage))
  }

  editMessage(conversationId: string, messageId: string, text: string): Observable<ChatMessage> {
    return this.http
      .patch<BackendMessageDto>(`${this.baseUrl}/${conversationId}/messages/${messageId}`, { text })
      .pipe(map(mapChatMessage))
  }

  deleteMessage(conversationId: string, messageId: string, scope: 'self' | 'everyone'): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${conversationId}/messages/${messageId}`, {
      params: { scope }
    })
  }

  forwardMessage(
    conversationId: string,
    messageId: string,
    targetConversationIds: string[],
    caption?: string
  ): Observable<ChatMessage[]> {
    return this.http
      .post<BackendMessageDto[]>(`${this.baseUrl}/${conversationId}/messages/${messageId}/forward`, {
        targetConversationIds,
        caption: caption?.trim() || null
      })
      .pipe(map(messages => messages.map(mapChatMessage)))
  }

  sendMessageWithMedia(conversationId: string, options: SendMediaOptions): Observable<ChatMessage> {
    const formData = new FormData()
    if (options.text?.trim()) {
      formData.append('text', options.text.trim())
    }
    if (options.replyToMessageId) {
      formData.append('replyToMessageId', options.replyToMessageId)
    }
    if (options.remoteImageUrl?.trim()) {
      formData.append('remoteImageUrl', options.remoteImageUrl.trim())
    }
    if (options.image) {
      formData.append('image', options.image)
    }
    if (options.video) {
      formData.append('video', options.video)
    }
    if (options.document) {
      formData.append('document', options.document)
    }
    if (options.audio) {
      formData.append('audio', options.audio)
    }

    return this.http
      .post<BackendMessageDto>(`${this.baseUrl}/${conversationId}/messages/media`, formData)
      .pipe(map(mapChatMessage))
  }

  toggleReaction(
    conversationId: string,
    messageId: string,
    emoji: string
  ): Observable<MessageReactionSummary[]> {
    return this.http
      .post<{ reactions: BackendMessageReactionSummaryDto[] }>(
        `${this.baseUrl}/${conversationId}/messages/${messageId}/reactions`,
        { emoji }
      )
      .pipe(map(response => response.reactions.map(reaction => ({
        emoji: reaction.emoji,
        count: reaction.count,
        reactedByMe: reaction.reactedByMe
      }))))
  }

  markAsRead(conversationId: string): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${conversationId}/read`, {})
  }

  getUnreadCount(): Observable<UnreadMessagesCountResponse> {
    return this.http.get<UnreadMessagesCountResponse>(`${this.baseUrl}/unread-count`)
  }

  refreshUnreadCount(): Observable<number> {
    return this.fetchUnreadCount().pipe(tap(count => this.unreadCountSubject.next(count)))
  }

  getUnreadCountValue(): number {
    return this.unreadCountSubject.getValue()
  }

  decrementUnreadLocally(count = 1): void {
    const current = this.unreadCountSubject.getValue()
    this.unreadCountSubject.next(Math.max(0, current - count))
  }

  incrementUnreadLocally(count = 1): void {
    const current = this.unreadCountSubject.getValue()
    this.unreadCountSubject.next(current + count)
  }

  private fetchUnreadCount(): Observable<number> {
    return this.getUnreadCount().pipe(
      map(response => response.count),
      catchError(() => of(this.unreadCountSubject.getValue()))
    )
  }
}
