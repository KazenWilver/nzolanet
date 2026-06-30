import { Injectable } from '@angular/core';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Gere focus trap e restore para overlays modais e diálogos.
 */
@Injectable({ providedIn: 'root' })
export class FocusTrapService {
  private previousFocus: HTMLElement | null = null;
  private container: HTMLElement | null = null;
  private keydownHandler: ((event: KeyboardEvent) => void) | null = null;

  /**
   * Activa o trap de foco dentro do contentor e guarda o elemento activo.
   */
  activate(container: HTMLElement, initialFocus?: HTMLElement): void {
    this.deactivate();

    this.previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    this.container = container;

    this.keydownHandler = (event: KeyboardEvent) => this.handleKeydown(event);
    container.addEventListener('keydown', this.keydownHandler);

    requestAnimationFrame(() => {
      const target = initialFocus ?? this.getFocusableElements(container)[0];
      target?.focus();
    });
  }

  /**
   * Desactiva o trap e restaura o foco ao elemento anterior.
   */
  deactivate(): void {
    if (this.container && this.keydownHandler) {
      this.container.removeEventListener('keydown', this.keydownHandler);
    }

    this.container = null;
    this.keydownHandler = null;

    const restoreTarget = this.previousFocus;
    this.previousFocus = null;

    if (restoreTarget?.isConnected) {
      requestAnimationFrame(() => {
        restoreTarget.focus();
      });
    }
  }

  private handleKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Tab' || !this.container) {
      return;
    }

    const focusable = this.getFocusableElements(this.container);
    if (focusable.length === 0) {
      event.preventDefault();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;

    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
      return;
    }

    if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  private getFocusableElements(root: HTMLElement): HTMLElement[] {
    return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(element => {
      if (element.hasAttribute('disabled') || element.getAttribute('aria-hidden') === 'true') {
        return false;
      }

      return element.offsetParent !== null || element === document.activeElement;
    });
  }
}
