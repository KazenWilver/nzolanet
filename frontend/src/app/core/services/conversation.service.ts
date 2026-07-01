import { Injectable, inject } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { BehaviorSubject, Observable, Subscription, interval, of } from 'rxjs'
import { catchError, distinctUntilChanged, map, switchMap, tap } from 'rxjs/operators'
import { environment } from '../../../environments/environment'
import { AuthService } from './auth.service'
import type {
  BackendConversationListItemDto,
  BackendMessageDto,
  ChatMessage,
  ConversationListItem,
  UnreadMessagesCountResponse
} from '../models/conversation.model'
import { mapChatMessage, mapConversationListItem } from '../models/conversation.model'

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

        this.pollingSubscription = interval(15000)
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

  getMessages(conversationId: string, limit = 50, before?: string): Observable<ChatMessage[]> {
    const params: Record<string, string> = { limit: String(limit) }
    if (before) {
      params['before'] = before
    }

    return this.http
      .get<BackendMessageDto[]>(`${this.baseUrl}/${conversationId}/messages`, { params })
      .pipe(map(messages => messages.map(mapChatMessage)))
  }

  sendMessage(conversationId: string, text: string): Observable<ChatMessage> {
    return this.http
      .post<BackendMessageDto>(`${this.baseUrl}/${conversationId}/messages`, { text })
      .pipe(map(mapChatMessage))
  }

  sendMessageWithMedia(conversationId: string, image: File, text?: string): Observable<ChatMessage> {
    const formData = new FormData()
    if (text?.trim()) {
      formData.append('text', text.trim())
    }
    formData.append('image', image)

    return this.http
      .post<BackendMessageDto>(`${this.baseUrl}/${conversationId}/messages/media`, formData)
      .pipe(map(mapChatMessage))
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

  private fetchUnreadCount(): Observable<number> {
    return this.getUnreadCount().pipe(
      map(response => response.count),
      catchError(() => of(this.unreadCountSubject.getValue()))
    )
  }
}
