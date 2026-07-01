import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter, map } from 'rxjs/operators';
import { WhoToFollowComponent } from '../../shared/components/who-to-follow/who-to-follow.component';
import { SearchService } from '../../core/services/search.service';

@Component({
  selector: 'app-aside',
  standalone: true,
  imports: [FormsModule, RouterModule, WhoToFollowComponent],
  templateUrl: './aside.component.html',
  styleUrl: './aside.component.scss'
})
export class AsideComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly searchService = inject(SearchService);

  searchQuery = '';
  trendingHashtags: string[] = [];

  ngOnInit(): void {
    this.syncFromUrl(this.router.url);

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        map(event => event.urlAfterRedirects),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(url => this.syncFromUrl(url));

    this.searchService
      .getTrendingHashtags(10)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: hashtags => {
          this.trendingHashtags = hashtags;
        }
      });
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
