import { Injectable, inject } from '@angular/core'
import * as signalR from '@microsoft/signalr'
import { BehaviorSubject, Subject } from 'rxjs'
import { AuthService } from './auth.service'
import { environment } from '../../../environments/environment'
import type { ChatMessage } from '../models/conversation.model'
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

interface BackendMessageBroadcast {
  id: string
  conversationId: string
  senderId: string
  senderUsername: string
  senderDisplayName?: string
  senderPhotoUrl?: string
  text: string
  imageUrl?: string
  createdAt: string
  isRead?: boolean
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

  readonly connected$ = this.connectedSubject.asObservable()
  readonly message$ = this.messageSubject.asObservable()
  readonly typing$ = this.typingSubject.asObservable()
  readonly readReceipt$ = this.readReceiptSubject.asObservable()

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
