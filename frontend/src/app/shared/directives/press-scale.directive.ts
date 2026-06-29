import { Directive, ElementRef, HostListener, inject } from '@angular/core';
import { AnimationService } from '../../core/services/animation.service';

/**
 * Feedback táctil ao premir botões e links (mobile e desktop).
 */
@Directive({
  selector: '[appPressScale]',
  standalone: true
})
export class PressScaleDirective {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly animationService = inject(AnimationService);

  @HostListener('pointerdown', ['$event'])
  handlePointerDown(event: PointerEvent): void {
    if (event.button !== 0) {
      return;
    }

    const element = this.elementRef.nativeElement;
    if (element.matches(':disabled') || element.getAttribute('aria-disabled') === 'true') {
      return;
    }

    this.animationService.pressFeedback(element);
  }
}
