import { Injectable, signal } from '@angular/core';
import type { Publication } from '../models/publication.model';

export interface PublicationMediaOverlayState {
  publication: Publication;
  videoStartTime: number;
}

/**
 * Abre publicações com media em overlay fullscreen (por cima de todo o layout).
 */
@Injectable({ providedIn: 'root' })
export class PublicationMediaOverlayService {
  private readonly stateSignal = signal<PublicationMediaOverlayState | null>(null);

  readonly state = this.stateSignal.asReadonly();

  open(publication: Publication, videoStartTime = 0): void {
    this.stateSignal.set({ publication, videoStartTime });
  }

  updatePublication(publication: Publication): void {
    const current = this.stateSignal();
    if (!current || current.publication.id !== publication.id) {
      return;
    }

    this.stateSignal.set({ ...current, publication });
  }

  close(): void {
    this.stateSignal.set(null);
  }
}
