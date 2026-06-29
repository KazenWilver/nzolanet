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

  ngAfterViewInit(): void {
    requestAnimationFrame(() => {
      this.animationService.enter(
        this.elementRef.nativeElement,
        this.enterVariant,
        this.enterDelay
      );
    });
  }
}
