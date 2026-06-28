import { Component, EventEmitter, Input, Output } from '@angular/core';
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
      z-index: 1000;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding: var(--spacing-3xl) var(--spacing-lg);
      background-color: rgba(91, 112, 131, 0.4);
    }

    .modal__dialog {
      width: 100%;
      max-width: var(--width-modal);
      border-radius: var(--border-radius-lg);
      background-color: var(--color-bg-modal);
      box-shadow: var(--color-shadow-menu);
      overflow: hidden;
    }

    .modal__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
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
    }
  `
})
export class ModalComponent {
  @Input() open = false;
  @Input() title = '';
  @Output() closed = new EventEmitter<void>();

  handleClose(): void {
    this.closed.emit();
  }

  handleBackdropClick(): void {
    this.handleClose();
  }
}
