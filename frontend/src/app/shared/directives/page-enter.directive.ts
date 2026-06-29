import { AfterViewInit, Directive, ElementRef, inject } from '@angular/core';
import { AnimationService } from '../../core/services/animation.service';

/**
 * Animação de entrada suave para páginas completas.
 */
@Directive({
  selector: '[appPageEnter]',
  standalone: true
})
export class PageEnterDirective implements AfterViewInit {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly animationService = inject(AnimationService);

  ngAfterViewInit(): void {
    requestAnimationFrame(() => {
      this.animationService.pageEnter(this.elementRef.nativeElement);
    });
  }
}
