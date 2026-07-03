import { Component, DestroyRef, Input, OnInit, inject } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { RouterModule } from '@angular/router'
import { debounceTime } from 'rxjs/operators'
import { SearchService } from '../../../core/services/search.service'
import { PublicationService } from '../../../core/services/publication.service'
import { AnimationService } from '../../../core/services/animation.service'

/**
 * Lista de hashtags em tendência, reutilizada no aside desktop e no feed mobile.
 */
@Component({
  selector: 'app-trends-panel',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './trends-panel.component.html',
  styleUrl: './trends-panel.component.scss'
})
export class TrendsPanelComponent implements OnInit {
  private readonly searchService = inject(SearchService)
  private readonly publicationService = inject(PublicationService)
  private readonly animationService = inject(AnimationService)
  private readonly destroyRef = inject(DestroyRef)

  @Input() limit = 5
  @Input() compact = false

  trendingHashtags: { tag: string; count: number }[] = []
  trendsError = false
  loading = true

  ngOnInit(): void {
    this.loadTrendingHashtags(true)

    this.publicationService.trendsRefresh$
      .pipe(
        debounceTime(150),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.loadTrendingHashtags(false)
      })
  }

  private loadTrendingHashtags(showLoader: boolean): void {
    if (showLoader) {
      this.loading = true
    }

    this.searchService
      .getTrendingHashtags(this.limit)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: hashtags => {
          this.trendingHashtags = hashtags ?? []
          this.trendsError = false
          this.loading = false
          requestAnimationFrame(() => {
            const items = document.querySelectorAll('.trends-panel__item')
            if (items.length > 0) {
              this.animationService.staggerEnter(Array.from(items), 'fadeUp', 0.05)
            }
          })
        },
        error: () => {
          this.trendingHashtags = []
          this.trendsError = true
          this.loading = false
        }
      })
  }
}
