import { Injectable, inject } from '@angular/core'
import * as signalR from '@microsoft/signalr'
import { BehaviorSubject, Subject } from 'rxjs'
import { AuthService } from './auth.service'
import { environment } from '../../../environments/environment'
import type { ChatMessage, MessageReactionSummary } from '../models/conversation.model'
import { mapChatMessage } from '../models/conversation.model'

export interface ChatTypingEvent {
  conversationId: string
  userId: string
  username: string
  isTyping: boolean
}

export interface ChatReadReceiptEvent {
  conversationId: string
  readerUserId: string
  readAt: string
}

export interface ChatReactionChangedEvent {
  conversationId: string
  messageId: string
  reactions: MessageReactionSummary[]
}

interface BackendMessageBroadcast {
  id: string
  conversationId: string
  senderId: string
  senderUsername: string
  senderDisplayName?: string
  senderPhotoUrl?: string
  text: string
  imageUrl?: string
  videoUrl?: string
  remoteImageUrl?: string
  forwardedFromMessageId?: string
  isEdited?: boolean
  isDeletedForEveryone?: boolean
  isGif?: boolean
  replyTo?: ChatMessage['replyTo']
  reactions?: MessageReactionSummary[]
  createdAt: string
  isRead?: boolean
}

export interface ChatMessageDeletedEvent {
  conversationId: string
  messageId: string
  scope: string
  actorUserId: string
}

export interface ChatMessageEditedEvent {
  conversationId: string
  actorUserId: string
  message: ChatMessage
}

@Injectable({ providedIn: 'root' })
export class ChatRealtimeService {
  private readonly authService = inject(AuthService)

  private connection?: signalR.HubConnection
  private activeConversationId: string | null = null
  private connectPromise: Promise<void> | null = null
  private readonly connectedSubject = new BehaviorSubject(false)
  private readonly messageSubject = new Subject<ChatMessage>()
  private readonly typingSubject = new Subject<ChatTypingEvent>()
  private readonly readReceiptSubject = new Subject<ChatReadReceiptEvent>()
  private readonly reactionChangedSubject = new Subject<ChatReactionChangedEvent>()
  private readonly messageDeletedSubject = new Subject<ChatMessageDeletedEvent>()
  private readonly messageEditedSubject = new Subject<ChatMessageEditedEvent>()

  readonly connected$ = this.connectedSubject.asObservable()
  readonly message$ = this.messageSubject.asObservable()
  readonly typing$ = this.typingSubject.asObservable()
  readonly readReceipt$ = this.readReceiptSubject.asObservable()
  readonly reactionChanged$ = this.reactionChangedSubject.asObservable()
  readonly messageDeleted$ = this.messageDeletedSubject.asObservable()
  readonly messageEdited$ = this.messageEditedSubject.asObservable()

  async connect(): Promise<void> {
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      return
    }

    if (this.connectPromise) {
      return this.connectPromise
    }

    const token = this.authService.getToken()
    if (!token) {
      return
    }

    this.connectPromise = this.startConnection()
    try {
      await this.connectPromise
    } finally {
      this.connectPromise = null
    }
  }

  async disconnect(): Promise<void> {
    if (!this.connection) {
      return
    }

    if (this.activeConversationId) {
      await this.leaveConversation(this.activeConversationId)
    }

    try {
      await this.connection.stop()
    } catch {
      // Ignorar falhas ao fechar ligação
    }

    this.connection = undefined
    this.connectedSubject.next(false)
  }

  async setActiveConversation(conversationId: string | null): Promise<void> {
    if (this.activeConversationId === conversationId) {
      return
    }

    if (this.activeConversationId) {
      await this.leaveConversation(this.activeConversationId)
    }

    this.activeConversationId = conversationId

    if (!conversationId) {
      return
    }

    try {
      await this.connect()
      await this.joinConversation(conversationId)
    } catch {
      this.connectedSubject.next(false)
    }
  }

  async notifyTyping(conversationId: string): Promise<void> {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      return
    }

    try {
      await this.connection.invoke('NotifyTyping', conversationId)
    } catch {
      // Ignorar falhas pontuais de typing
    }
  }

  async notifyStoppedTyping(conversationId: string): Promise<void> {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      return
    }

    try {
      await this.connection.invoke('NotifyStoppedTyping', conversationId)
    } catch {
      // Ignorar falhas pontuais de typing
    }
  }

  isConnected(): boolean {
    return this.connection?.state === signalR.HubConnectionState.Connected
  }

  private async startConnection(): Promise<void> {
    if (this.connection?.state === signalR.HubConnectionState.Connecting) {
      return
    }

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(environment.chatHubUrl, {
        accessTokenFactory: () => this.authService.getToken() ?? ''
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000])
      .build()

    this.connection.on('MessageReceived', (payload: BackendMessageBroadcast) => {
      const currentUserId = this.authService.getCurrentUser()?.id?.toLowerCase()
      const message = mapChatMessage({
        ...payload,
        isGif: payload.isGif ?? false,
        reactions: payload.reactions ?? [],
        isMine: currentUserId === payload.senderId?.toLowerCase(),
        isRead: payload.isRead ?? false
      })
      this.messageSubject.next(message)
    })

    this.connection.on('TypingChanged', (payload: ChatTypingEvent) => {
      this.typingSubject.next({
        ...payload,
        conversationId: String(payload.conversationId),
        userId: String(payload.userId)
      })
    })

    this.connection.on('ReadReceiptUpdated', (payload: ChatReadReceiptEvent) => {
      this.readReceiptSubject.next({
        conversationId: String(payload.conversationId),
        readerUserId: String(payload.readerUserId),
        readAt: payload.readAt
      })
    })

    this.connection.on('MessageReactionChanged', (payload: ChatReactionChangedEvent) => {
      this.reactionChangedSubject.next({
        conversationId: String(payload.conversationId),
        messageId: String(payload.messageId),
        reactions: (payload.reactions ?? []).map(reaction => ({
          emoji: reaction.emoji,
          count: reaction.count,
          reactedByMe: reaction.reactedByMe
        }))
      })
    })

    this.connection.on('MessageDeleted', (payload: ChatMessageDeletedEvent) => {
      this.messageDeletedSubject.next({
        conversationId: String(payload.conversationId),
        messageId: String(payload.messageId),
        scope: String(payload.scope),
        actorUserId: String(payload.actorUserId)
      })
    })

    this.connection.on('MessageEdited', (payload: { conversationId: string; actorUserId: string; message: BackendMessageBroadcast }) => {
      const currentUserId = this.authService.getCurrentUser()?.id?.toLowerCase()
      this.messageEditedSubject.next({
        conversationId: String(payload.conversationId),
        actorUserId: String(payload.actorUserId),
        message: mapChatMessage({
          ...payload.message,
          isGif: payload.message.isGif ?? false,
          reactions: payload.message.reactions ?? [],
          isMine: currentUserId === payload.message.senderId?.toLowerCase(),
          isRead: payload.message.isRead ?? false
        })
      })
    })

    this.connection.onreconnected(async () => {
      this.connectedSubject.next(true)
      if (this.activeConversationId) {
        await this.joinConversation(this.activeConversationId)
      }
    })

    this.connection.onclose(() => {
      this.connectedSubject.next(false)
    })

    await this.connection.start()
    this.connectedSubject.next(true)

    if (this.activeConversationId) {
      await this.joinConversation(this.activeConversationId)
    }
  }

  private async joinConversation(conversationId: string): Promise<void> {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      return
    }

    await this.connection.invoke('JoinConversation', conversationId)
  }

  private async leaveConversation(conversationId: string): Promise<void> {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      return
    }

    try {
      await this.connection.invoke('LeaveConversation', conversationId)
    } catch {
      // Ignorar ao sair
    }
  }
}
