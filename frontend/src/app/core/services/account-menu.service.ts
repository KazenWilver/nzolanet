import { Injectable, signal } from '@angular/core';

/**
 * Controls the mobile account menu rendered at layout root to avoid stacking issues.
 */
@Injectable({ providedIn: 'root' })
export class AccountMenuService {
  readonly isOpen = signal(false);

  toggle(): void {
    this.isOpen.update(open => !open);
  }

  close(): void {
    this.isOpen.set(false);
  }
}
