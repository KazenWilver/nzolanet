import { Directive, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, inject } from '@angular/core';

/**
 * Emite quando o elemento entra na área visível do contentor com scroll.
 */
@Directive({
  selector: '[appInfiniteScroll]',
  standalone: true
})
export class InfiniteScrollDirective implements OnInit, OnDestroy {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private observer?: IntersectionObserver;

  @Input() infiniteScrollDisabled = false;
  @Input() infiniteScrollRoot: HTMLElement | null = null;
  @Output() readonly appInfiniteScroll = new EventEmitter<void>();

  ngOnInit(): void {
    const root = this.infiniteScrollRoot ?? this.findScrollRoot();

    this.observer = new IntersectionObserver(
      entries => {
        const entry = entries[0];
        if (entry?.isIntersecting && !this.infiniteScrollDisabled) {
          this.appInfiniteScroll.emit();
        }
      },
      {
        root,
        rootMargin: '120px',
        threshold: 0
      }
    );

    this.observer.observe(this.elementRef.nativeElement);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  private findScrollRoot(): HTMLElement | null {
    let element = this.elementRef.nativeElement.parentElement;

    while (element && element !== document.body) {
      const { overflowY } = getComputedStyle(element);

      if (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay') {
        return element;
      }

      element = element.parentElement;
    }

    return null;
  }
}
