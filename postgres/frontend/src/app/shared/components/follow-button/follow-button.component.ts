import { Component, EventEmitter, Input, Output } from '@angular/core';
import { PressScaleDirective } from '../../directives/press-scale.directive';

/**
 * Botão Seguir / A seguir com hover "Deixar de seguir" estilo X/Twitter.
 */
@Component({
  selector: 'app-follow-button',
  standalone: true,
  imports: [PressScaleDirective],
  template: `
    <button
      type="button"
      class="follow-btn"
      [class.follow-btn--sm]="size === 'sm'"
      [class.follow-btn--following]="isFollowing || isPending"
      [class.follow-btn--pending]="isPending && !isFollowing"
      [disabled]="disabled || loading"
      [attr.aria-pressed]="isFollowing || isPending"
      appPressScale
      (click)="handleClick($event)"
    >
      @if (isFollowing) {
        <span class="follow-btn__label follow-btn__label--default">A seguir</span>
        <span class="follow-btn__label follow-btn__label--hover">Deixar de seguir</span>
      } @else if (isPending) {
        <span class="follow-btn__label follow-btn__label--default">Pendente</span>
        <span class="follow-btn__label follow-btn__label--hover">Cancelar pedido</span>
      } @else {
        <span class="follow-btn__label">Seguir</span>
      }
    </button>
  `,
  styleUrl: './follow-button.component.scss'
})
export class FollowButtonComponent {
  @Input() isFollowing = false;
  @Input() isPending = false;
  @Input() loading = false;
  @Input() disabled = false;
  @Input() size: 'sm' | 'md' = 'md';

  @Output() readonly followClick = new EventEmitter<MouseEvent>();

  handleClick(event: MouseEvent): void {
    event.stopPropagation();
    this.followClick.emit(event);
  }
}
