import { AfterViewInit, Directive, ElementRef, Input, inject } from '@angular/core';
import { AnimationService } from '../../core/services/animation.service';

type EnterVariant = 'fadeUp' | 'fadeIn' | 'scaleIn' | 'slideRight';

/**
 * Anima a entrada do elemento quando é montado (listas, cards, secções).
 */
@Directive({
  selector: '[appEnterAnimation]',
  standalone: true
})
export class EnterAnimationDirective implements AfterViewInit {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly animationService = inject(AnimationService);

  @Input() enterVariant: EnterVariant = 'fadeUp';
  @Input() enterDelay = 0;
  /** Índice na lista para escalonar entradas (atraso máx. ~360ms). */
  @Input() enterIndex?: number;

  ngAfterViewInit(): void {
    const staggerDelay = this.enterIndex != null
      ? Math.min(this.enterIndex * 0.045, 0.36)
      : 0;

    requestAnimationFrame(() => {
      this.animationService.enter(
        this.elementRef.nativeElement,
        this.enterVariant,
        this.enterDelay + staggerDelay
      );
    });
  }
}
