import { Injectable, signal } from '@angular/core';

/**
 * Controla o menu da conta no layout principal e gere o foco do trigger.
 */
@Injectable({ providedIn: 'root' })
export class AccountMenuService {
  readonly isOpen = signal(false);
  private triggerElement: HTMLElement | null = null;

  toggle(trigger?: HTMLElement): void {
    if (this.isOpen()) {
      this.close();
      return;
    }

    this.triggerElement = trigger ?? this.triggerElement;
    this.isOpen.set(true);
  }

  open(trigger?: HTMLElement): void {
    if (trigger) {
      this.triggerElement = trigger;
    }

    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
    this.restoreTriggerFocus();
  }

  getTriggerElement(): HTMLElement | null {
    return this.triggerElement;
  }

  private restoreTriggerFocus(): void {
    const trigger = this.triggerElement;
    this.triggerElement = null;

    if (trigger?.isConnected) {
      requestAnimationFrame(() => {
        trigger.focus();
      });
    }
  }
}
