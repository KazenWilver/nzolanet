import { AfterViewInit, Directive, ElementRef, OnDestroy, inject } from '@angular/core';
import gsap from 'gsap';
import { AnimationService } from '../../core/services/animation.service';

/**
 * Parallax suave na capa do perfil durante o scroll.
 */
@Directive({
  selector: '[appProfileParallax]',
  standalone: true
})
export class ProfileParallaxDirective implements AfterViewInit, OnDestroy {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly animationService = inject(AnimationService);

  private scrollContainer: HTMLElement | null = null;
  private parallaxLayer: HTMLElement | null = null;
  private rafId = 0;
  private readonly handleScroll = (): void => {
    if (this.rafId) {
      return;
    }

    this.rafId = requestAnimationFrame(() => {
      this.rafId = 0;
      this.applyParallax();
    });
  };

  ngAfterViewInit(): void {
    if (!this.animationService.isEnabled) {
      return;
    }

    this.scrollContainer = document.querySelector('.main-layout__center');
    this.parallaxLayer =
      this.elementRef.nativeElement.querySelector('.profile-page__cover-image') ??
      this.elementRef.nativeElement.querySelector('.profile-page__cover');

    if (!this.scrollContainer || !this.parallaxLayer) {
      return;
    }

    gsap.set(this.parallaxLayer, { transformOrigin: 'center top', willChange: 'transform' });
    this.scrollContainer.addEventListener('scroll', this.handleScroll, { passive: true });
    this.applyParallax();
  }

  ngOnDestroy(): void {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }

    this.scrollContainer?.removeEventListener('scroll', this.handleScroll);

    if (this.parallaxLayer) {
      gsap.set(this.parallaxLayer, { clearProps: 'transform,willChange' });
    }
  }

  private applyParallax(): void {
    if (!this.scrollContainer || !this.parallaxLayer) {
      return;
    }

    const scrollTop = this.scrollContainer.scrollTop;
    const offset = Math.min(scrollTop * 0.42, 96);
    const scale = 1 + Math.min(scrollTop / 2400, 0.08);

    gsap.set(this.parallaxLayer, {
      y: offset,
      scale
    });
  }
}
