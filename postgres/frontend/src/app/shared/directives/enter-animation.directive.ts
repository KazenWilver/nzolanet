import { AfterViewInit, Directive, ElementRef, Input, OnDestroy, inject } from '@angular/core';
import gsap from 'gsap';
import { AnimationService } from '../../core/services/animation.service';

type EnterVariant = 'fadeUp' | 'fadeIn' | 'scaleIn' | 'slideRight';

/**
 * Anima a entrada do elemento quando é montado (listas, cards, secções).
 */
@Directive({
  selector: '[appEnterAnimation]',
  standalone: true
})
export class EnterAnimationDirective implements AfterViewInit, OnDestroy {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly animationService = inject(AnimationService);

  @Input() enterVariant: EnterVariant = 'fadeUp';
  @Input() enterDelay = 0;
  /** Índice na lista para escalonar entradas. */
  @Input() enterIndex?: number;
  /** Máximo de itens com animação escalonada (resto aparece instantâneo). */
  @Input() enterStaggerMax = 7;
  @Input() skipEnter = false;

  private tween: gsap.core.Tween | null = null;
  private rafId = 0;

  ngAfterViewInit(): void {
    if (this.skipEnter || !this.animationService.isEnabled) {
      return;
    }

    const index = this.enterIndex ?? 0;
    if (index > this.enterStaggerMax) {
      return;
    }

    const staggerDelay = Math.min(index * 0.045, 0.36);

    this.rafId = requestAnimationFrame(() => {
      this.rafId = 0;

      if (!this.elementRef.nativeElement.isConnected) {
        return;
      }

      this.tween = this.animationService.enter(
        this.elementRef.nativeElement,
        this.enterVariant,
        this.enterDelay + staggerDelay
      );
    });
  }

  ngOnDestroy(): void {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }

    const element = this.elementRef.nativeElement;
    this.tween?.kill();
    gsap.killTweensOf(element);
    gsap.set(element, { clearProps: 'opacity,transform,scale,x,y' });
  }
}
