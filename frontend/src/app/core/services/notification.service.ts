import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subscription, interval, of } from 'rxjs';
import { catchError, distinctUntilChanged, map, switchMap, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { resolveMediaUrl } from '../helpers/media-url.helper';
import type {
  AppNotification,
  BackendNotificationDto,
  UnreadCountResponse
} from '../models/notification.model';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  private readonly baseUrl = `${environment.apiUrl}/notifications`;
  private readonly unreadCountSubject = new BehaviorSubject<number>(0);
  private pollingSubscription?: Subscription;

  readonly unreadCount$ = this.unreadCountSubject.asObservable();

  constructor() {
    this.authService.currentUser$
      .pipe(distinctUntilChanged((previous, current) => previous?.id === current?.id))
      .subscribe(user => {
        this.pollingSubscription?.unsubscribe();

        if (!user) {
          this.unreadCountSubject.next(0);
          return;
        }

        this.refreshUnreadCount().subscribe();

        this.pollingSubscription = interval(5000)
          .pipe(switchMap(() => this.fetchUnreadCount()))
          .subscribe(count => this.unreadCountSubject.next(count));
      });
  }

  getNotifications(): Observable<AppNotification[]> {
    return this.http
      .get<BackendNotificationDto[]>(this.baseUrl)
      .pipe(map(notifications => notifications.map(notification => this.mapNotification(notification))));
  }

  getUnreadCount(): Observable<UnreadCountResponse> {
    return this.http.get<UnreadCountResponse>(`${this.baseUrl}/unread-count`);
  }

  markAsRead(id: string): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}/read`, {});
  }

  markAsReadLocally(id: string): void {
    this.decrementUnreadCount();
    this.markAsRead(id)
      .pipe(
        catchError(() => {
          this.refreshUnreadCount().subscribe();
          return of(undefined);
        })
      )
      .subscribe();
  }

  markAllAsRead(): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/read-all`, {}).pipe(
      tap(() => this.unreadCountSubject.next(0))
    );
  }

  deleteNotification(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  refreshUnreadCount(): Observable<number> {
    return this.fetchUnreadCount().pipe(
      tap(count => this.unreadCountSubject.next(count))
    );
  }

  getUnreadCountValue(): number {
    return this.unreadCountSubject.getValue();
  }

  notifyUnreadDecreased(wasUnread: boolean): void {
    if (wasUnread) {
      this.decrementUnreadCount();
    }
  }

  private fetchUnreadCount(): Observable<number> {
    return this.getUnreadCount().pipe(
      map(response => response.count),
      catchError(() => of(this.unreadCountSubject.getValue()))
    );
  }

  private decrementUnreadCount(): void {
    const current = this.unreadCountSubject.getValue();
    if (current > 0) {
      this.unreadCountSubject.next(current - 1);
    }
  }

  incrementUnreadCount(count = 1): void {
    const current = this.unreadCountSubject.getValue();
    this.unreadCountSubject.next(current + count);
  }

  private mapNotification(dto: BackendNotificationDto): AppNotification {
    return {
      id: dto.id,
      type: dto.type,
      isRead: dto.isRead,
      createdAt: dto.createdAt,
      actorId: dto.actorId,
      actorUsername: dto.actorUsername,
      actorDisplayName: dto.actorDisplayName,
      actorPhotoUrl: resolveMediaUrl(dto.actorPhotoUrl),
      publicationId: dto.publicationId,
      publicationText: dto.publicationText,
      commentId: dto.commentId,
      commentText: dto.commentText,
      conversationId: dto.conversationId,
      messageText: dto.messageText
    };
  }
}
