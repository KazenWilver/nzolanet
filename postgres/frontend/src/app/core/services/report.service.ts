import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable } from 'rxjs'
import { environment } from '../../../environments/environment'

export interface ReportPayload {
  reason: string
  details?: string
}

@Injectable({ providedIn: 'root' })
export class ReportService {
  private readonly publicationsBaseUrl = `${environment.apiUrl}/publications`
  private readonly commentsBaseUrl = `${environment.apiUrl}/comments`

  constructor(private readonly http: HttpClient) {}

  reportPublication(publicationId: string, payload: ReportPayload): Observable<void> {
    return this.http.post<void>(`${this.publicationsBaseUrl}/${publicationId}/report`, payload)
  }

  reportComment(commentId: string, payload: ReportPayload): Observable<void> {
    return this.http.post<void>(`${this.commentsBaseUrl}/${commentId}/report`, payload)
  }
}
