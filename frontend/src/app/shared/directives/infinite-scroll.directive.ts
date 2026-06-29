import { Directive, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, inject } from '@angular/core';

/**
 * Emite quando o elemento entra na viewport para carregar mais conteúdo.
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
    this.observer = new IntersectionObserver(
      entries => {
        const entry = entries[0];
        if (entry?.isIntersecting && !this.infiniteScrollDisabled) {
          this.appInfiniteScroll.emit();
        }
      },
      {
        root: this.infiniteScrollRoot,
        rootMargin: '120px',
        threshold: 0
      }
    );

    this.observer.observe(this.elementRef.nativeElement);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
