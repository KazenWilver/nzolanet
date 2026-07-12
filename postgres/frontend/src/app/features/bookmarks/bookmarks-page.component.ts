import { Component, DestroyRef, OnInit, inject } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { CommonModule } from '@angular/common'
import { PublicationService } from '../../core/services/publication.service'
import { AuthService } from '../../core/services/auth.service'
import type { Publication } from '../../core/models/publication.model'
import { PublicationCardComponent } from '../../shared/components/publication-card/publication-card.component'
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component'
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component'
import { EnterAnimationDirective } from '../../shared/directives/enter-animation.directive'
import { TPipe } from '../../core/i18n/translate.pipe'

@Component({
  selector: 'app-bookmarks-page',
  standalone: true,
  imports: [CommonModule, PublicationCardComponent, LoadingSpinnerComponent, PageHeaderComponent, EnterAnimationDirective, TPipe],
  template: `
    <section class="bookmarks-page">
      <app-page-header [title]="'nav.bookmarks' | t" [showBack]="true" />

      @if (loading) {
        <div class="bookmarks-page__loading">
          <app-loading-spinner tamanho="md" />
        </div>
      } @else if (error) {
        <p class="bookmarks-page__state">{{ 'errors.generic' | t }}</p>
      } @else if (items.length === 0) {
        <p class="bookmarks-page__state">{{ 'notifications.empty' | t }}</p>
      } @else {
        <div class="bookmarks-page__list">
          @for (item of items; track item.id) {
            <div appEnterAnimation [enterIndex]="$index">
              <app-publication-card
                [publication]="item"
                [currentUserId]="currentUserId"
                (deleted)="handleRemoved($event)"
              />
            </div>
          }
        </div>
      }
    </section>
  `,
  styles: `
    .bookmarks-page {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .bookmarks-page__loading,
    .bookmarks-page__state {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 180px;
      color: var(--color-text-secondary);
    }

    .bookmarks-page__list {
      display: flex;
      flex-direction: column;
      gap: 0;
    }
  `
})
export class BookmarksPageComponent implements OnInit {
  private readonly publicationService = inject(PublicationService)
  private readonly authService = inject(AuthService)
  private readonly destroyRef = inject(DestroyRef)

  items: Publication[] = []
  loading = true
  error = false
  currentUserId?: string

  ngOnInit(): void {
    this.currentUserId = this.authService.getCurrentUser()?.id
    this.publicationService
      .getMyBookmarks()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: response => {
          this.items = response.items
          this.loading = false
        },
        error: () => {
          this.error = true
          this.loading = false
        }
      })
  }

  handleRemoved(publicationId: string): void {
    this.items = this.items.filter(item => item.id !== publicationId)
  }
}
