import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../../../core/services/auth.service';
import { PublicationService } from '../../../core/services/publication.service';
import type { Publication } from '../../../core/models/publication.model';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { PublicationThreadModalComponent } from '../../../shared/components/publication-thread-modal/publication-thread-modal.component';
import { PublicationCardSkeletonComponent } from '../../../shared/components/publication-card-skeleton/publication-card-skeleton.component';
import { EnterAnimationDirective } from '../../../shared/directives/enter-animation.directive';

@Component({
  selector: 'app-publication-detail-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    PageHeaderComponent,
    PublicationThreadModalComponent,
    PublicationCardSkeletonComponent,
    EnterAnimationDirective
  ],
  templateUrl: './publication-detail-page.component.html',
  styleUrl: './publication-detail-page.component.scss'
})
export class PublicationDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly publicationService = inject(PublicationService);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  publication: Publication | null = null;
  loading = true;
  notFound = false;
  forbidden = false;
  loadError = false;
  mediaFocus = false;
  currentUserId?: string;

  ngOnInit(): void {
    this.authService.currentUser$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(user => {
        this.currentUserId = user?.id;
      });

    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const id = params.get('id');
      if (!id) {
        void this.router.navigate(['/feed']);
        return;
      }

      this.loadPublication(id);
    });

    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      this.mediaFocus = params.get('media') === '1';
    });
  }

  get authorName(): string {
    return this.publication?.authorDisplayName ?? this.publication?.authorUsername ?? 'Publicação';
  }

  get headerSubtitle(): string | undefined {
    if (!this.publication) {
      return undefined;
    }

    return `@${this.publication.authorUsername}`;
  }

  handlePublicationChange(updated: Publication): void {
    this.publication = updated;
  }

  retryLoad(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadPublication(id);
    }
  }

  private loadPublication(id: string): void {
    this.loading = true;
    this.notFound = false;
    this.forbidden = false;
    this.loadError = false;
    this.publication = null;

    this.publicationService
      .getById(id)
      .pipe(
        finalize(() => {
          this.loading = false;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: publication => {
          this.publication = publication;
        },
        error: (error: HttpErrorResponse) => {
          if (error.status === 404) {
            this.notFound = true;
            return;
          }

          if (error.status === 403) {
            this.forbidden = true;
            return;
          }

          this.loadError = true;
        }
      });
  }
}
