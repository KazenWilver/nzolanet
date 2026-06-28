import { Component, EventEmitter, HostListener, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (open) {
      <div class="modal" role="presentation" (click)="handleBackdropClick()">
        <div
          class="modal__dialog"
          role="dialog"
          aria-modal="true"
          [attr.aria-label]="title"
          (click)="$event.stopPropagation()"
        >
          <header class="modal__header">
            <h2 class="modal__title">{{ title }}</h2>
            <button
              type="button"
              class="modal__close"
              aria-label="Fechar"
              (click)="handleClose()"
            >
              ×
            </button>
          </header>
          <div class="modal__body">
            <ng-content />
          </div>
        </div>
      </div>
    }
  `,
  styles: `
    .modal {
      position: fixed;
      inset: 0;
      z-index: 1200;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--spacing-lg);
      background-color: rgba(91, 112, 131, 0.45);
      overscroll-behavior: contain;
    }

    .modal__dialog {
      width: 100%;
      max-width: var(--width-modal);
      max-height: min(90vh, 720px);
      display: flex;
      flex-direction: column;
      border-radius: var(--border-radius-lg);
      background-color: var(--color-bg-modal);
      box-shadow: var(--color-shadow-menu);
      overflow: hidden;
    }

    .modal__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-shrink: 0;
      padding: var(--spacing-md) var(--spacing-lg);
      border-bottom: var(--border-width) solid var(--color-border);
    }

    .modal__title {
      margin: 0;
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-bold);
      color: var(--color-text-primary);
    }

    .modal__close {
      border: none;
      background: transparent;
      color: var(--color-text-secondary);
      font-size: 1.75rem;
      line-height: 1;
      cursor: pointer;
      border-radius: var(--border-radius-full);
      width: 36px;
      height: 36px;

      &:hover {
        background-color: var(--color-bg-hover);
      }
    }

    .modal__body {
      padding: var(--spacing-lg);
      overflow-y: auto;
      flex: 1;
      min-height: 0;
    }

    @media (max-width: 500px) {
      .modal {
        align-items: flex-end;
        padding: 0;
      }

      .modal__dialog {
        max-height: 92vh;
        border-bottom-left-radius: 0;
        border-bottom-right-radius: 0;
      }

      .modal__body {
        padding: var(--spacing-md);
      }
    }

    @media (min-width: 768px) {
      .modal__dialog {
        max-width: min(var(--width-modal), calc(100vw - 2rem));
      }
    }

    @media (min-width: 1536px) {
      .modal {
        padding: var(--spacing-3xl);
      }
    }
  `
})
export class ModalComponent implements OnChanges {
  @Input() open = false;
  @Input() title = '';
  @Output() closed = new EventEmitter<void>();

  ngOnChanges(changes: SimpleChanges): void {
    if ('open' in changes) {
      this.updateBodyScrollLock(this.open);
    }
  }

  @HostListener('document:keydown.escape')
  handleEscape(): void {
    if (this.open) {
      this.handleClose();
    }
  }

  handleClose(): void {
    this.closed.emit();
  }

  handleBackdropClick(): void {
    this.handleClose();
  }

  private updateBodyScrollLock(locked: boolean): void {
    document.body.style.overflow = locked ? 'hidden' : '';
    document.body.style.touchAction = locked ? 'none' : '';
  }
}
