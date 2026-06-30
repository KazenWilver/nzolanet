import { Injectable } from '@angular/core';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface TrapLayer {
  container: HTMLElement;
  previousFocus: HTMLElement | null;
  keydownHandler: (event: KeyboardEvent) => void;
  documentKeydownHandler: (event: KeyboardEvent) => void;
}

/**
 * Gere focus trap e restore para overlays modais e diálogos.
 */
@Injectable({ providedIn: 'root' })
export class FocusTrapService {
  private previousFocus: HTMLElement | null = null;
  private container: HTMLElement | null = null;
  private keydownHandler: ((event: KeyboardEvent) => void) | null = null;
  private documentKeydownHandler: ((event: KeyboardEvent) => void) | null = null;
  private readonly stack: TrapLayer[] = [];

  /**
   * Activa o trap de foco dentro do contentor e guarda o elemento activo.
   */
  activate(container: HTMLElement, initialFocus?: HTMLElement): void {
    if (this.container && this.keydownHandler && this.documentKeydownHandler) {
      this.stack.push({
        container: this.container,
        previousFocus: this.previousFocus,
        keydownHandler: this.keydownHandler,
        documentKeydownHandler: this.documentKeydownHandler
      });
      this.detachListeners();
    } else {
      this.previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    }

    this.container = container;

    this.keydownHandler = (event: KeyboardEvent) => this.handleKeydown(event);
    container.addEventListener('keydown', this.keydownHandler);

    this.documentKeydownHandler = (event: KeyboardEvent) => this.handleDocumentKeydown(event);
    document.addEventListener('keydown', this.documentKeydownHandler, true);

    requestAnimationFrame(() => {
      const target = initialFocus ?? this.getFocusableElements(container)[0];
      target?.focus();
    });
  }

  /**
   * Desactiva o trap e restaura o foco ao elemento anterior.
   */
  deactivate(): void {
    this.detachListeners();

    if (this.stack.length > 0) {
      const layer = this.stack.pop()!;
      this.container = layer.container;
      this.previousFocus = layer.previousFocus;
      this.keydownHandler = layer.keydownHandler;
      this.documentKeydownHandler = layer.documentKeydownHandler;
      layer.container.addEventListener('keydown', layer.keydownHandler);
      document.addEventListener('keydown', layer.documentKeydownHandler, true);
      return;
    }

    this.container = null;
    this.keydownHandler = null;
    this.documentKeydownHandler = null;

    const restoreTarget = this.previousFocus;
    this.previousFocus = null;

    if (restoreTarget?.isConnected) {
      requestAnimationFrame(() => {
        restoreTarget.focus();
      });
    }
  }

  private detachListeners(): void {
    if (this.container && this.keydownHandler) {
      this.container.removeEventListener('keydown', this.keydownHandler);
    }

    if (this.documentKeydownHandler) {
      document.removeEventListener('keydown', this.documentKeydownHandler, true);
    }
  }

  private handleDocumentKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Tab' || !this.container) {
      return;
    }

    if (this.container.contains(document.activeElement)) {
      return;
    }

    const focusable = this.getFocusableElements(this.container);
    if (focusable.length === 0) {
      return;
    }

    event.preventDefault();
    focusable[0].focus();
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

    if (!this.container.contains(active)) {
      event.preventDefault();
      first.focus();
      return;
    }

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
