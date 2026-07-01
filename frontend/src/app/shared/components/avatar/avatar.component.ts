import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { resolveMediaUrl } from '../../../core/helpers/media-url.helper';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

@Component({
  selector: 'app-avatar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="avatar"
      [class]="'avatar--' + size"
      [class.avatar--ring]="withRing"
      [style.background-color]="!resolvedSrc || imageError ? avatarColor : null"
      role="img"
      [attr.aria-label]="username"
    >
      @if (resolvedSrc && !imageError) {
        <img
          class="avatar__image"
          [src]="resolvedSrc"
          [alt]="username"
          loading="lazy"
          (error)="handleImageError()"
        />
      } @else {
        <span class="avatar__initial">{{ initial }}</span>
      }
    </div>
  `,
  styles: `
    .avatar {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--border-radius-full);
      overflow: hidden;
      flex-shrink: 0;
      color: #fff;
      font-weight: var(--font-weight-bold);
      user-select: none;
    }

    .avatar__image {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .avatar__initial {
      text-transform: uppercase;
      line-height: 1;
    }

    .avatar--xs {
      width: 24px;
      height: 24px;
      font-size: 0.625rem;
    }

    .avatar--sm {
      width: 32px;
      height: 32px;
      font-size: 0.75rem;
    }

    .avatar--md {
      width: 48px;
      height: 48px;
      font-size: 0.9375rem;
    }

    .avatar--lg {
      width: 64px;
      height: 64px;
      font-size: 1.25rem;
    }

    .avatar--xl {
      width: 134px;
      height: 134px;
      font-size: 2.5rem;
    }

    .avatar--ring {
      box-shadow: 0 0 0 4px var(--color-bg-primary);
    }
  `
})
export class AvatarComponent implements OnChanges {
  @Input() src?: string;
  @Input() username = '';
  @Input() size: AvatarSize = 'md';
  @Input() avatarKey = '';
  @Input() withRing = false;

  resolvedSrc?: string;
  imageError = false;
  initial = '?';
  avatarColor = '#1d9bf0';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['src'] || changes['avatarKey']) {
      this.imageError = false;
      this.resolvedSrc = resolveMediaUrl(this.src);
    }

    if (changes['username'] || changes['src']) {
      this.initial = this.username.trim().charAt(0).toUpperCase() || '?';
      this.avatarColor = this.buildColorFromUsername(this.username);
    }
  }

  handleImageError(): void {
    this.imageError = true;
  }

  private buildColorFromUsername(value: string): string {
    if (!value) {
      return '#1d9bf0';
    }

    let hash = 0;
    for (let index = 0; index < value.length; index += 1) {
      hash = value.charCodeAt(index) + ((hash << 5) - hash);
    }

    const hue = Math.abs(hash) % 360;
    return `hsl(${hue} 55% 45%)`;
  }
}
