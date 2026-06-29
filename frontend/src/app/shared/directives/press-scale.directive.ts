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

  @HostListener('pointerdown')
  handlePointerDown(): void {
    if (this.elementRef.nativeElement.disabled) {
      return;
    }

    this.animationService.pressFeedback(this.elementRef.nativeElement);
  }
}
