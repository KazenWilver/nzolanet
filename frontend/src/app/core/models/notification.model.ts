export type NotificationType =
  | 'baze'
  | 'comment'
  | 'follow'
  | 'follow_request'
  | 'follow_accepted'
  | 'follow_rejected'
  | 'message';

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
  conversationId?: string;
  messageText?: string;
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
  conversationId?: string;
  messageText?: string;
}

export interface UnreadCountResponse {
  count: number;
}
