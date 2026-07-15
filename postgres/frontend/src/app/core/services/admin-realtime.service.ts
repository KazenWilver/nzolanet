import { Injectable, inject } from '@angular/core'
import * as signalR from '@microsoft/signalr'
import { ReplaySubject } from 'rxjs'
import { AdminAuthService } from './admin-auth.service'
import { environment } from '../../../environments/environment'
import type { AdminOnlineUser } from './admin.service'
import { resolveMediaUrl } from '../helpers/media-url.helper'

export interface AdminPresenceMetricsEvent {
  totalUtilizadoresOnline: number
  totalUtilizadoresOffline: number
}

@Injectable({ providedIn: 'root' })
export class AdminRealtimeService {
  private readonly adminAuth = inject(AdminAuthService)

  private connection?: signalR.HubConnection
  private connectPromise: Promise<void> | null = null
  private readonly presenceMetricsSubject = new ReplaySubject<AdminPresenceMetricsEvent>(1)
  private readonly onlineUsersSubject = new ReplaySubject<AdminOnlineUser[]>(1)

  readonly presenceMetrics$ = this.presenceMetricsSubject.asObservable()
  readonly onlineUsers$ = this.onlineUsersSubject.asObservable()

  async connect(): Promise<void> {
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      return
    }

    if (this.connectPromise) {
      return this.connectPromise
    }

    const token = this.adminAuth.getToken()
    if (!token) {
      return
    }

    this.connectPromise = this.startConnection(token).finally(() => {
      this.connectPromise = null
    })

    return this.connectPromise
  }

  async disconnect(): Promise<void> {
    if (!this.connection) {
      return
    }

    await this.connection.stop()
    this.connection = undefined
  }

  private async startConnection(token: string): Promise<void> {
    const hubUrl = environment.adminHubUrl

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => token
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000])
      .build()

    this.connection.on('PresenceMetricsUpdated', (payload: AdminPresenceMetricsEvent) => {
      this.presenceMetricsSubject.next(payload)
    })

    this.connection.on('OnlineUsersUpdated', (payload: AdminOnlineUser[]) => {
      const users = (payload ?? []).map(user => ({
        ...user,
        isOnline: true,
        profilePhotoUrl: resolveMediaUrl(user.profilePhotoUrl)
      }))
      this.onlineUsersSubject.next(users)
    })

    await this.connection.start()
  }
}
