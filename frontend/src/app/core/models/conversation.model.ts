import { resolveMediaUrl } from '../helpers/media-url.helper'

export interface BackendConversationListItemDto {
  id: string
  otherUserId: string
  otherUsername: string
  otherDisplayName?: string
  otherPhotoUrl?: string
  lastMessageText?: string
  lastMessageAt?: string
  unreadCount: number
}

export interface BackendMessageDto {
  id: string
  conversationId: string
  senderId: string
  senderUsername: string
  senderDisplayName?: string
  senderPhotoUrl?: string
  text: string
  imageUrl?: string
  createdAt: string
  isMine: boolean
  isRead: boolean
}

export interface ConversationListItem {
  id: string
  otherUserId: string
  otherUsername: string
  otherDisplayName?: string
  otherPhotoUrl?: string
  lastMessageText?: string
  lastMessageAt?: string
  unreadCount: number
}

export interface ChatMessage {
  id: string
  conversationId: string
  senderId: string
  senderUsername: string
  senderDisplayName?: string
  senderPhotoUrl?: string
  text: string
  imageUrl?: string
  createdAt: string
  isMine: boolean
  isRead: boolean
}

export interface UnreadMessagesCountResponse {
  count: number
}

export const mapConversationListItem = (dto: BackendConversationListItemDto): ConversationListItem => ({
  id: dto.id,
  otherUserId: dto.otherUserId,
  otherUsername: dto.otherUsername,
  otherDisplayName: dto.otherDisplayName,
  otherPhotoUrl: resolveMediaUrl(dto.otherPhotoUrl),
  lastMessageText: dto.lastMessageText,
  lastMessageAt: dto.lastMessageAt,
  unreadCount: dto.unreadCount
})

export const mapChatMessage = (dto: BackendMessageDto): ChatMessage => ({
  id: dto.id,
  conversationId: dto.conversationId,
  senderId: dto.senderId,
  senderUsername: dto.senderUsername,
  senderDisplayName: dto.senderDisplayName,
  senderPhotoUrl: resolveMediaUrl(dto.senderPhotoUrl),
  text: dto.text,
  imageUrl: resolveMediaUrl(dto.imageUrl),
  createdAt: dto.createdAt,
  isMine: dto.isMine,
  isRead: dto.isRead ?? false
})
