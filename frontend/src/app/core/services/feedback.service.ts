import { Injectable, inject } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable } from 'rxjs'
import { environment } from '../../../environments/environment'

export interface CreateFeedbackPayload {
  message: string
}

export interface FeedbackEntry {
  id: string
  userId: string
  username: string
  displayName?: string
  email?: string
  message: string
  createdAt: string
}

/**
 * Submits and (for admins, via AdminService) lists application feedback.
 */
@Injectable({ providedIn: 'root' })
export class FeedbackService {
  private readonly http = inject(HttpClient)
  private readonly baseUrl = `${environment.apiUrl}/feedback`

  submit(payload: CreateFeedbackPayload): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(this.baseUrl, payload)
  }
}
