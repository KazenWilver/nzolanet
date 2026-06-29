import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Bloqueia o scroll do contentor principal da app (desktop e mobile).
 */
@Injectable({ providedIn: 'root' })
export class ScrollLockService {
  private readonly platformId = inject(PLATFORM_ID);
  private lockCount = 0;
  private scrollContainer: HTMLElement | null = null;
  private previousOverflow = '';

  lock(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.lockCount += 1;
    if (this.lockCount !== 1) {
      return;
    }

    this.scrollContainer = document.querySelector('.main-layout__center');
    if (this.scrollContainer) {
      this.previousOverflow = this.scrollContainer.style.overflow;
      this.scrollContainer.style.overflow = 'hidden';
    }

    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
  }

  unlock(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.lockCount = Math.max(0, this.lockCount - 1);
    if (this.lockCount !== 0) {
      return;
    }

    if (this.scrollContainer) {
      this.scrollContainer.style.overflow = this.previousOverflow;
      this.scrollContainer = null;
      this.previousOverflow = '';
    }

    document.body.style.overflow = '';
    document.body.style.touchAction = '';
  }
}
