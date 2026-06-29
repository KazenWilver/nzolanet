export type NotificationType = 'baze' | 'comment' | 'follow';

export interface BackendNotificationDto {
  id: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
  actorId: string;
  actorUsername: string;
  actorDisplayName?: string;
  actorPhotoUrl?: string;
  publicationId?: string;
  publicationText?: string;
  commentId?: string;
  commentText?: string;
}

export interface AppNotification {
  id: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
  actorId: string;
  actorUsername: string;
  actorDisplayName?: string;
  actorPhotoUrl?: string;
  publicationId?: string;
  publicationText?: string;
  commentId?: string;
  commentText?: string;
}

export interface UnreadCountResponse {
  count: number;
}
