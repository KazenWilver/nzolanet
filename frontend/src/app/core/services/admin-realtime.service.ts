import { Injectable } from '@angular/core'
import * as signalR from '@microsoft/signalr'
import { BehaviorSubject, Subject } from 'rxjs'
import { environment } from '../../../environments/environment'

export type AdminRealtimeConnectionState = 'connected' | 'reconnecting' | 'offline'

@Injectable({ providedIn: 'root' })
export class AdminRealtimeService {
  private connection?: signalR.HubConnection
  private connectPromise: Promise<void> | null = null
  private readonly connectedSubject = new BehaviorSubject(false)
  private readonly connectionStateSubject = new BehaviorSubject<AdminRealtimeConnectionState>('offline')
  private readonly metricsUpdatedSubject = new Subject<void>()
  private readonly reportsUpdatedSubject = new Subject<void>()

  readonly connected$ = this.connectedSubject.asObservable()
  readonly connectionState$ = this.connectionStateSubject.asObservable()
  readonly metricsUpdated$ = this.metricsUpdatedSubject.asObservable()
  readonly reportsUpdated$ = this.reportsUpdatedSubject.asObservable()

  async connect(): Promise<void> {
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      return
    }

    if (this.connectPromise) {
      return this.connectPromise
    }

    const token = this.getAdminToken()
    if (!token) {
      this.connectionStateSubject.next('offline')
      return
    }

    this.connectionStateSubject.next('reconnecting')
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

    try {
      await this.connection.stop()
    } catch {
      // Ignorar falhas ao encerrar ligação
    }

    this.connection = undefined
    this.connectedSubject.next(false)
    this.connectionStateSubject.next('offline')
  }

  private getAdminToken(): string {
    return localStorage.getItem('admin_token') ?? ''
  }

  private async startConnection(): Promise<void> {
    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(environment.adminHubUrl, {
        accessTokenFactory: () => this.getAdminToken()
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000])
      .build()

    this.connection.on('AdminMetricsUpdated', () => {
      this.metricsUpdatedSubject.next()
    })

    this.connection.on('AdminReportsUpdated', () => {
      this.reportsUpdatedSubject.next()
    })

    this.connection.onreconnected(() => {
      this.connectedSubject.next(true)
      this.connectionStateSubject.next('connected')
      this.metricsUpdatedSubject.next()
      this.reportsUpdatedSubject.next()
    })

    this.connection.onreconnecting(() => {
      this.connectedSubject.next(false)
      this.connectionStateSubject.next('reconnecting')
    })

    this.connection.onclose(() => {
      this.connectedSubject.next(false)
      this.connectionStateSubject.next('offline')
    })

    await this.connection.start()
    this.connectedSubject.next(true)
    this.connectionStateSubject.next('connected')
  }
}
