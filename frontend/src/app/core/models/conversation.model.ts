import { resolveMediaUrl } from '../helpers/media-url.helper'

export interface BackendMessageReplyPreviewDto {
  id: string
  senderId: string
  senderUsername: string
  senderDisplayName?: string
  text: string
  imageUrl?: string
  videoUrl?: string
  isGif: boolean
}

export interface BackendMessageReactionSummaryDto {
  emoji: string
  count: number
  reactedByMe: boolean
}

export type MessageReadStatus = 'sent' | 'delivered' | 'read'

export interface BackendConversationListItemDto {
  id: string
  otherUserId?: string
  otherUsername?: string
  otherDisplayName?: string
  otherPhotoUrl?: string
  otherUserIsOnline?: boolean
  otherUserLastSeenAt?: string
  title?: string
  description?: string
  imageUrl?: string
  isGroup?: boolean
  participantCount?: number
  lastMessageText?: string
  lastMessageAt?: string
  unreadCount: number
}

export interface BackendConversationParticipantDto {
  userId: string
  username: string
  displayName?: string
  photoUrl?: string
}

export interface BackendConversationDetailDto extends BackendConversationListItemDto {
  participants: BackendConversationParticipantDto[]
  isGroupCreator?: boolean
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
  videoUrl?: string
  audioUrl?: string
  documentUrl?: string
  documentFileName?: string
  remoteImageUrl?: string
  forwardedFromMessageId?: string
  isEdited?: boolean
  isDeletedForEveryone?: boolean
  isGif: boolean
  replyTo?: BackendMessageReplyPreviewDto
  reactions: BackendMessageReactionSummaryDto[]
  createdAt: string
  isMine: boolean
  isRead: boolean
  readStatus?: MessageReadStatus
}

export interface MessageReplyPreview {
  id: string
  senderId: string
  senderUsername: string
  senderDisplayName?: string
  text: string
  imageUrl?: string
  videoUrl?: string
  isGif: boolean
}

export interface MessageReactionSummary {
  emoji: string
  count: number
  reactedByMe: boolean
}

export interface ConversationParticipant {
  userId: string
  username: string
  displayName?: string
  photoUrl?: string
}

export interface ConversationListItem {
  id: string
  otherUserId?: string
  otherUsername?: string
  otherDisplayName?: string
  otherPhotoUrl?: string
  otherUserIsOnline?: boolean
  otherUserLastSeenAt?: string
  title?: string
  description?: string
  imageUrl?: string
  isGroup: boolean
  participantCount: number
  lastMessageText?: string
  lastMessageAt?: string
  unreadCount: number
}

export interface ConversationDetail extends ConversationListItem {
  participants: ConversationParticipant[]
  isGroupCreator?: boolean
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
  videoUrl?: string
  audioUrl?: string
  documentUrl?: string
  documentFileName?: string
  remoteImageUrl?: string
  forwardedFromMessageId?: string
  isEdited: boolean
  isDeletedForEveryone: boolean
  isGif: boolean
  replyTo?: MessageReplyPreview
  reactions: MessageReactionSummary[]
  createdAt: string
  isMine: boolean
  isRead: boolean
  readStatus?: MessageReadStatus
}

export interface UnreadMessagesCountResponse {
  count: number
}

const mapReplyPreview = (dto: BackendMessageReplyPreviewDto): MessageReplyPreview => ({
  id: dto.id,
  senderId: dto.senderId,
  senderUsername: dto.senderUsername,
  senderDisplayName: dto.senderDisplayName,
  text: dto.text,
  imageUrl: resolveMediaUrl(dto.imageUrl),
  videoUrl: resolveMediaUrl(dto.videoUrl),
  isGif: dto.isGif ?? false
})

const mapReactions = (dto: BackendMessageReactionSummaryDto[] | undefined): MessageReactionSummary[] =>
  (dto ?? []).map(reaction => ({
    emoji: reaction.emoji,
    count: reaction.count,
    reactedByMe: reaction.reactedByMe
  }))

export const mapConversationListItem = (dto: BackendConversationListItemDto): ConversationListItem => ({
  id: dto.id,
  otherUserId: dto.otherUserId,
  otherUsername: dto.otherUsername,
  otherDisplayName: dto.otherDisplayName,
  otherPhotoUrl: resolveMediaUrl(dto.otherPhotoUrl),
  otherUserIsOnline: dto.otherUserIsOnline,
  otherUserLastSeenAt: dto.otherUserLastSeenAt,
  title: dto.title,
  description: dto.description,
  imageUrl: resolveMediaUrl(dto.imageUrl),
  isGroup: dto.isGroup ?? false,
  participantCount: dto.participantCount ?? (dto.isGroup ? 0 : 2),
  lastMessageText: dto.lastMessageText,
  lastMessageAt: dto.lastMessageAt,
  unreadCount: dto.unreadCount
})

export const mapConversationDetail = (dto: BackendConversationDetailDto): ConversationDetail => ({
  ...mapConversationListItem(dto),
  isGroupCreator: dto.isGroupCreator ?? false,
  participants: (dto.participants ?? []).map(participant => ({
    userId: participant.userId,
    username: participant.username,
    displayName: participant.displayName,
    photoUrl: resolveMediaUrl(participant.photoUrl)
  }))
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
  videoUrl: resolveMediaUrl(dto.videoUrl),
  audioUrl: resolveMediaUrl(dto.audioUrl),
  documentUrl: resolveMediaUrl(dto.documentUrl),
  documentFileName: dto.documentFileName,
  remoteImageUrl: dto.remoteImageUrl,
  forwardedFromMessageId: dto.forwardedFromMessageId,
  isEdited: dto.isEdited ?? false,
  isDeletedForEveryone: dto.isDeletedForEveryone ?? false,
  isGif: dto.isGif ?? false,
  replyTo: dto.replyTo ? mapReplyPreview(dto.replyTo) : undefined,
  reactions: mapReactions(dto.reactions),
  createdAt: dto.createdAt,
  isMine: dto.isMine,
  isRead: dto.isRead ?? false,
  readStatus: dto.readStatus ?? (dto.isRead ? 'read' : 'sent')
})
