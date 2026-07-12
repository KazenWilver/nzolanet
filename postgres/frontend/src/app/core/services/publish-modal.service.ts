import { Injectable, signal } from '@angular/core';

/**
 * Controla a abertura do modal global de criação de publicação.
 */
@Injectable({ providedIn: 'root' })
export class PublishModalService {
  private readonly openState = signal(false);

  /** Indica se o modal de publicação está visível. */
  readonly isOpen = this.openState.asReadonly();

  /** Abre o modal de criação de publicação. */
  open(): void {
    this.openState.set(true);
  }

  /** Fecha o modal de criação de publicação. */
  close(): void {
    this.openState.set(false);
  }
}
