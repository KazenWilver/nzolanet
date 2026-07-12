import {
  Directive,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  inject
} from '@angular/core';

/**
 * Emite quando o elemento entra na área visível do contentor com scroll.
 */
@Directive({
  selector: '[appInfiniteScroll]',
  standalone: true
})
export class InfiniteScrollDirective implements OnInit, OnChanges, OnDestroy {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private observer?: IntersectionObserver;
  private lastEmitAt = 0;

  @Input() infiniteScrollDisabled = false;
  @Input() infiniteScrollRoot: HTMLElement | null = null;
  @Output() readonly appInfiniteScroll = new EventEmitter<void>();

  ngOnInit(): void {
    this.createObserver();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ('infiniteScrollDisabled' in changes || 'infiniteScrollRoot' in changes) {
      this.observer?.disconnect();
      this.createObserver();
    }
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  private createObserver(): void {
    const root = this.infiniteScrollRoot ?? this.findScrollRoot();

    this.observer = new IntersectionObserver(
      entries => {
        const entry = entries[0];
        if (!entry?.isIntersecting || this.infiniteScrollDisabled) {
          return;
        }

        const now = Date.now();
        if (now - this.lastEmitAt < 400) {
          return;
        }

        this.lastEmitAt = now;
        this.appInfiniteScroll.emit();
      },
      {
        root,
        rootMargin: '120px',
        threshold: 0
      }
    );

    this.observer.observe(this.elementRef.nativeElement);
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
