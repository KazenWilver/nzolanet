import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import { PublicationService } from '../../../core/services/publication.service';
import type { User } from '../../../core/models/user.model';
import type { Publication } from '../../../core/models/publication.model';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';
import { PublicationCardComponent } from '../../../shared/components/publication-card/publication-card.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EditProfileModalComponent } from '../edit-profile-modal/edit-profile-modal.component';
import { FollowersModalComponent } from '../followers-modal/followers-modal.component';

type ProfileTab = 'publications' | 'likes';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    DatePipe,
    AvatarComponent,
    PublicationCardComponent,
    LoadingSpinnerComponent,
    EditProfileModalComponent,
    FollowersModalComponent
  ],
  templateUrl: './profile-page.component.html',
  styleUrl: './profile-page.component.scss'
})
export class ProfilePageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly userService = inject(UserService);
  private readonly publicationService = inject(PublicationService);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  profile: User | null = null;
  publications: Publication[] = [];
  likedPublications: Publication[] = [];
  private lastProfileUserId = '';
  loadingProfile = true;
  loadingPublications = false;
  loadingLikes = false;
  profileError = false;
  profileNotFound = false;
  contentLoadError = false;
  privateAccount = false;
  togglingFollow = false;
  editModalOpen = false;
  followersModalOpen = false;
  followersModalMode: 'followers' | 'following' = 'followers';
  activeTab: ProfileTab = 'publications';
  currentUserId?: string;
  private profileRequestId = 0;
  private publicationsRequestId = 0;
  private likesRequestId = 0;

  ngOnInit(): void {
    this.authService.currentUser$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(user => {
        this.currentUserId = user?.id;
        if (user && (this.profile?.id === user.id || this.lastProfileUserId === user.id)) {
          this.syncOwnPublicationAuthors(user);
        }
      });

    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const id = params.get('id') ?? '';
      this.lastProfileUserId = id;
      this.loadProfile(id);
    });
  }

  get isOwnProfile(): boolean {
    return !!this.profile && this.profile.id === this.currentUserId;
  }

  get displayName(): string {
    return this.profile?.displayName ?? this.profile?.username ?? '';
  }

  get followLabel(): string {
    if (!this.profile) {
      return 'Seguir';
    }
    if (this.profile.isFollowing) {
      return 'A seguir';
    }
    if (this.profile.isPending) {
      return 'Pendente';
    }
    return 'Seguir';
  }

  get canViewPublications(): boolean {
    if (!this.profile) {
      return false;
    }
    return this.isOwnProfile || !this.profile.isPrivate || this.profile.isFollowing === true;
  }

  loadProfile(userId: string): void {
    const requestId = ++this.profileRequestId;
    this.loadingProfile = true;
    this.profileError = false;
    this.profileNotFound = false;
    this.contentLoadError = false;
    this.privateAccount = false;
    this.publications = [];
    this.likedPublications = [];
    this.activeTab = 'publications';

    this.userService
      .getProfile(userId)
      .pipe(
        finalize(() => {
          if (requestId === this.profileRequestId) {
            this.loadingProfile = false;
          }
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
      next: profile => {
        if (requestId !== this.profileRequestId) {
          return;
        }

        this.profile = profile;

        if (this.canViewPublications) {
          this.loadPublications(userId);
        } else {
          this.privateAccount = true;
        }
      },
      error: (error: HttpErrorResponse) => {
        if (requestId !== this.profileRequestId) {
          return;
        }

        if (error.status === 404) {
          this.profileNotFound = true;
        } else {
          this.profileError = true;
        }
      }
    });
  }

  retryLoadProfile(): void {
    if (this.lastProfileUserId) {
      this.loadProfile(this.lastProfileUserId);
    }
  }

  retryContentLoad(): void {
    if (!this.profile) {
      return;
    }

    this.contentLoadError = false;
    if (this.activeTab === 'likes') {
      this.loadLikedPublications(this.profile.id);
    } else {
      this.loadPublications(this.profile.id);
    }
  }

  loadPublications(userId: string): void {
    const requestId = ++this.publicationsRequestId;
    this.loadingPublications = true;
    this.privateAccount = false;
    this.contentLoadError = false;

    this.publicationService
      .getByUser(userId)
      .pipe(
        finalize(() => {
          if (requestId === this.publicationsRequestId) {
            this.loadingPublications = false;
          }
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
      next: publications => {
        if (requestId !== this.publicationsRequestId) {
          return;
        }

        this.publications = publications.sort(
          (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
        );
      },
      error: (error: HttpErrorResponse) => {
        if (requestId !== this.publicationsRequestId) {
          return;
        }

        this.publications = [];
        if (error.status === 403) {
          this.privateAccount = true;
        } else {
          this.contentLoadError = true;
        }
      }
    });
  }

  loadLikedPublications(userId: string): void {
    const requestId = ++this.likesRequestId;
    this.loadingLikes = true;
    this.privateAccount = false;
    this.contentLoadError = false;

    this.publicationService
      .getLikedByUser(userId)
      .pipe(
        finalize(() => {
          if (requestId === this.likesRequestId) {
            this.loadingLikes = false;
          }
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
      next: publications => {
        if (requestId !== this.likesRequestId) {
          return;
        }

        this.likedPublications = publications.sort(
          (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
        );
      },
      error: (error: HttpErrorResponse) => {
        if (requestId !== this.likesRequestId) {
          return;
        }

        this.likedPublications = [];
        if (error.status === 403) {
          this.privateAccount = true;
        } else {
          this.contentLoadError = true;
        }
      }
    });
  }

  openEditModal(): void {
    this.editModalOpen = true;
  }

  handleProfileSaved(user: User): void {
    this.profile = user;
    this.syncOwnPublicationAuthors(user);
  }

  private syncOwnPublicationAuthors(user: User): void {
    const patchAuthor = (publication: Publication): Publication =>
      publication.authorId === user.id
        ? {
            ...publication,
            authorUsername: user.username,
            authorDisplayName: user.displayName,
            authorPhotoUrl: user.profilePhotoUrl
          }
        : publication;

    this.publications = this.publications.map(patchAuthor);
    this.likedPublications = this.likedPublications.map(patchAuthor);
  }

  openFollowersModal(mode: 'followers' | 'following'): void {
    this.followersModalMode = mode;
    this.followersModalOpen = true;
  }

  toggleFollow(): void {
    if (!this.profile || this.isOwnProfile || this.togglingFollow) {
      return;
    }

    this.togglingFollow = true;
    const wasFollowing = this.profile.isFollowing === true;
    const wasPending = this.profile.isPending === true;

    const request$ =
      wasFollowing || wasPending
        ? this.userService.unfollow(this.profile.id)
        : this.userService.follow(this.profile.id);

    request$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
      next: () => {
        if (!this.profile) {
          return;
        }

        if (wasFollowing || wasPending) {
          this.profile = {
            ...this.profile,
            isFollowing: false,
            isPending: false,
            followersCount: wasFollowing
              ? Math.max(0, this.profile.followersCount - 1)
              : this.profile.followersCount
          };
          if (this.profile.isPrivate) {
            this.privateAccount = true;
            this.publications = [];
          }
        } else if (this.profile.isPrivate) {
          this.profile = {
            ...this.profile,
            isFollowing: false,
            isPending: true
          };
        } else {
          this.profile = {
            ...this.profile,
            isFollowing: true,
            isPending: false,
            followersCount: this.profile.followersCount + 1
          };
          this.loadPublications(this.profile.id);
        }

        this.togglingFollow = false;
      },
      error: () => {
        this.togglingFollow = false;
      }
    });
  }

  setActiveTab(tab: ProfileTab): void {
    this.activeTab = tab;

    if (!this.profile || !this.canViewPublications) {
      return;
    }

    if (tab === 'likes' && this.likedPublications.length === 0 && !this.loadingLikes) {
      this.loadLikedPublications(this.profile.id);
    }
  }

  handlePublicationDeleted(id: string): void {
    this.publications = this.publications.filter(publication => publication.id !== id);
    this.likedPublications = this.likedPublications.filter(publication => publication.id !== id);
  }

  handlePublicationUpdated(publication: Publication): void {
    this.publications = this.publications.map(item =>
      item.id === publication.id ? publication : item
    );
    this.likedPublications = this.likedPublications.map(item =>
      item.id === publication.id ? publication : item
    );
  }

  trackById(_: number, publication: Publication): string {
    return publication.id;
  }
}
