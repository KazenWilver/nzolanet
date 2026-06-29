import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map } from 'rxjs/operators';
import { WhoToFollowComponent } from '../../shared/components/who-to-follow/who-to-follow.component';

@Component({
  selector: 'app-aside',
  standalone: true,
  imports: [FormsModule, WhoToFollowComponent],
  templateUrl: './aside.component.html',
  styleUrl: './aside.component.scss'
})
export class AsideComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  searchQuery = '';

  ngOnInit(): void {
    this.syncFromUrl(this.router.url);

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        map(event => event.urlAfterRedirects),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(url => this.syncFromUrl(url));
  }

  handleSearchInput(): void {
    const query = this.searchQuery.trim();
    void this.router.navigate(['/search'], {
      queryParams: query ? { q: query } : {}
    });
  }

  handleSearchKeyup(): void {
    this.debouncedNavigate();
  }

  private syncFromUrl(url: string): void {
    if (!url.startsWith('/search')) {
      return;
    }

    const queryIndex = url.indexOf('?');
    if (queryIndex === -1) {
      this.searchQuery = '';
      return;
    }

    const params = new URLSearchParams(url.slice(queryIndex + 1));
    this.searchQuery = params.get('q') ?? '';
  }

  private debouncedNavigate = this.createDebouncer(() => {
    this.handleSearchInput();
  }, 300);

  private createDebouncer(fn: () => void, delay: number): () => void {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(fn, delay);
    };
  }
}
