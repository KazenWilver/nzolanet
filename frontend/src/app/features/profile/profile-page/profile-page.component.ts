import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import { PublicationService } from '../../../core/services/publication.service';
import type { User } from '../../../core/models/user.model';
import type { Publication } from '../../../core/models/publication.model';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';
import { PublicationCardComponent } from '../../../shared/components/publication-card/publication-card.component';
import { PlaceholderFeatureComponent } from '../../../shared/components/placeholder-feature/placeholder-feature.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EditProfileModalComponent } from '../edit-profile-modal/edit-profile-modal.component';
import { FollowersModalComponent } from '../followers-modal/followers-modal.component';

type ProfileTab = 'publications' | 'likes';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    AvatarComponent,
    PublicationCardComponent,
    PlaceholderFeatureComponent,
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
  loadingProfile = true;
  loadingPublications = false;
  profileError = false;
  privateAccount = false;
  togglingFollow = false;
  editModalOpen = false;
  followersModalOpen = false;
  followersModalMode: 'followers' | 'following' = 'followers';
  activeTab: ProfileTab = 'publications';
  currentUserId?: string;

  ngOnInit(): void {
    this.authService.currentUser$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(user => {
        this.currentUserId = user?.id;
      });

    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const id = params.get('id') ?? '';
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
    this.loadingProfile = true;
    this.profileError = false;
    this.privateAccount = false;
    this.publications = [];
    this.activeTab = 'publications';

    this.userService.getProfile(userId).subscribe({
      next: profile => {
        this.profile = profile;
        this.loadingProfile = false;

        if (this.canViewPublications) {
          this.loadPublications(userId);
        } else {
          this.privateAccount = true;
        }
      },
      error: () => {
        this.loadingProfile = false;
        this.profileError = true;
      }
    });
  }

  loadPublications(userId: string): void {
    this.loadingPublications = true;
    this.privateAccount = false;

    this.publicationService.getByUser(userId).subscribe({
      next: publications => {
        this.publications = publications.sort(
          (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
        );
        this.loadingPublications = false;
      },
      error: () => {
        this.loadingPublications = false;
        this.privateAccount = true;
        this.publications = [];
      }
    });
  }

  openEditModal(): void {
    this.editModalOpen = true;
  }

  handleProfileSaved(user: User): void {
    this.profile = user;
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

    request$.subscribe({
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
  }

  handlePublicationDeleted(id: string): void {
    this.publications = this.publications.filter(publication => publication.id !== id);
  }

  handlePublicationUpdated(publication: Publication): void {
    this.publications = this.publications.map(item =>
      item.id === publication.id ? publication : item
    );
  }

  trackById(_: number, publication: Publication): string {
    return publication.id;
  }
}
