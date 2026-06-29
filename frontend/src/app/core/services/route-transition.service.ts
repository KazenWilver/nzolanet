import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import gsap from 'gsap';
import { AnimationService } from './animation.service';

/**
 * Transições suaves entre rotas no contentor principal.
 */
@Injectable({ providedIn: 'root' })
export class RouteTransitionService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly animationService = inject(AnimationService);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private outgoingTween: gsap.core.Tween | null = null;
  private incomingTween: gsap.core.Tween | null = null;
  private skipNextIn = false;

  animateOut(): void {
    if (!this.isBrowser || !this.animationService.isEnabled) {
      return;
    }

    const target = this.getRouteHost();
    if (!target) {
      return;
    }

    this.incomingTween?.kill();
    this.outgoingTween?.kill();
    this.outgoingTween = gsap.to(target, {
      opacity: 0,
      y: -10,
      duration: 0.16,
      ease: 'power2.in',
      overwrite: 'auto'
    });
  }

  animateIn(): void {
    if (!this.isBrowser || !this.animationService.isEnabled) {
      this.resetScroll();
      return;
    }

    if (this.skipNextIn) {
      this.skipNextIn = false;
      this.resetScroll();
      return;
    }

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const target = this.getRouteHost();
        if (!target) {
          this.resetScroll();
          return;
        }

        this.outgoingTween?.kill();
        this.incomingTween?.kill();
        gsap.killTweensOf(target);
        gsap.set(target, { opacity: 0, y: 14 });
        this.incomingTween = gsap.to(target, {
          opacity: 1,
          y: 0,
          duration: 0.34,
          ease: 'power2.out',
          overwrite: 'auto',
          clearProps: 'transform,opacity'
        });
        this.resetScroll();
      });
    });
  }

  resetRouteHost(): void {
    if (!this.isBrowser) {
      return;
    }

    const target = this.getRouteHost();
    this.outgoingTween?.kill();
    this.incomingTween?.kill();

    if (target) {
      gsap.killTweensOf(target);
      gsap.set(target, { clearProps: 'opacity,transform,y' });
    }
  }

  skipEnterOnce(): void {
    this.skipNextIn = true;
  }

  private getRouteHost(): Element | null {
    return document.querySelector('.main-layout__content > *');
  }

  private resetScroll(): void {
    document.querySelector('.main-layout__center')?.scrollTo({ top: 0, behavior: 'auto' });
  }
}
