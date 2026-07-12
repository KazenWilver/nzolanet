import { DestroyRef, Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval } from 'rxjs';

/**
 * Fornece um tick periódico para actualizar pipes de tempo relativo sem pure: false.
 */
@Injectable({ providedIn: 'root' })
export class RelativeTimeService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);
  private readonly tickSignal = signal(0);

  readonly tick = this.tickSignal.asReadonly();

  constructor() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    interval(60_000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.tickSignal.update(value => value + 1);
      });
  }
}
