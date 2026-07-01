import { Injectable, inject } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable } from 'rxjs'
import { environment } from '../../../environments/environment'
import type {
  FimbuChatRequest,
  FimbuChatResponse,
  FimbuHistoryResponse
} from '../models/fimbu.model'

@Injectable({ providedIn: 'root' })
export class FimbuService {
  private readonly http = inject(HttpClient)
  private readonly baseUrl = `${environment.apiUrl}/fimbu`

  getHistory(): Observable<FimbuHistoryResponse> {
    return this.http.get<FimbuHistoryResponse>(`${this.baseUrl}/history`)
  }

  sendMessage(message: string): Observable<FimbuChatResponse> {
    const payload: FimbuChatRequest = { message }
    return this.http.post<FimbuChatResponse>(`${this.baseUrl}/chat`, payload)
  }

  clearHistory(): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/history`)
  }
}
