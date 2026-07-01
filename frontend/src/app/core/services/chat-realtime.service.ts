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

interface BackendMessageBroadcast {
  id: string
  conversationId: string
  senderId: string
  senderUsername: string
  senderDisplayName?: string
  senderPhotoUrl?: string
  text: string
  createdAt: string
}

@Injectable({ providedIn: 'root' })
export class ChatRealtimeService {
  private readonly authService = inject(AuthService)

  private connection?: signalR.HubConnection
  private activeConversationId: string | null = null
  private readonly connectedSubject = new BehaviorSubject(false)
  private readonly messageSubject = new Subject<ChatMessage>()
  private readonly typingSubject = new Subject<ChatTypingEvent>()

  readonly connected$ = this.connectedSubject.asObservable()
  readonly message$ = this.messageSubject.asObservable()
  readonly typing$ = this.typingSubject.asObservable()

  async connect(): Promise<void> {
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      return
    }

    if (this.connection?.state === signalR.HubConnectionState.Connecting) {
      return
    }

    const token = this.authService.getToken()
    if (!token) {
      return
    }

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(environment.chatHubUrl, {
        accessTokenFactory: () => this.authService.getToken() ?? ''
      })
      .withAutomaticReconnect()
      .build()

    this.connection.on('MessageReceived', (payload: BackendMessageBroadcast) => {
      const currentUserId = this.authService.getCurrentUser()?.id
      const message = mapChatMessage({
        ...payload,
        isMine: currentUserId === payload.senderId
      })
      this.messageSubject.next(message)
    })

    this.connection.on('TypingChanged', (payload: ChatTypingEvent) => {
      this.typingSubject.next(payload)
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

  async disconnect(): Promise<void> {
    if (!this.connection) {
      return
    }

    if (this.activeConversationId) {
      await this.leaveConversation(this.activeConversationId)
    }

    await this.connection.stop()
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

    await this.connect()
    await this.joinConversation(conversationId)
  }

  async notifyTyping(conversationId: string): Promise<void> {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      return
    }

    await this.connection.invoke('NotifyTyping', conversationId)
  }

  async notifyStoppedTyping(conversationId: string): Promise<void> {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      return
    }

    await this.connection.invoke('NotifyStoppedTyping', conversationId)
  }

  isConnected(): boolean {
    return this.connection?.state === signalR.HubConnectionState.Connected
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

    await this.connection.invoke('LeaveConversation', conversationId)
  }
}
