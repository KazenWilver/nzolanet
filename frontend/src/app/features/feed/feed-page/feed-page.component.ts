import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { PublicationService } from '../../../core/services/publication.service';
import type { Publication } from '../../../core/models/publication.model';
import { PublicationCardComponent } from '../../../shared/components/publication-card/publication-card.component';
import { CreatePostComponent } from '../create-post/create-post.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-feed-page',
  standalone: true,
  imports: [CommonModule, PublicationCardComponent, CreatePostComponent, LoadingSpinnerComponent],
  templateUrl: './feed-page.component.html',
  styleUrl: './feed-page.component.scss'
})
export class FeedPageComponent implements OnInit {
  private readonly publicationService = inject(PublicationService);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  publications: Publication[] = [];
  loading = true;
  error = false;
  currentUserId?: string;

  ngOnInit(): void {
    this.currentUserId = this.authService.getCurrentUser()?.id;
    this.loadFeed();

    this.publicationService.created$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(publication => this.prependPublication(publication));
  }

  loadFeed(): void {
    this.loading = true;
    this.error = false;

    this.publicationService.getAll().subscribe({
      next: publications => {
        this.publications = this.sortByDate(publications);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.error = true;
      }
    });
  }

  prependPublication(publication: Publication): void {
    if (this.publications.some(item => item.id === publication.id)) {
      return;
    }
    this.publications = [publication, ...this.publications];
  }

  handleCreated(publication: Publication): void {
    this.prependPublication(publication);
  }

  handleDeleted(id: string): void {
    this.publications = this.publications.filter(publication => publication.id !== id);
  }

  handleUpdated(publication: Publication): void {
    this.publications = this.publications.map(item =>
      item.id === publication.id ? publication : item
    );
  }

  trackById(_: number, publication: Publication): string {
    return publication.id;
  }

  private sortByDate(publications: Publication[]): Publication[] {
    return [...publications].sort(
      (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
    );
  }
}
