import { Component, DestroyRef, ElementRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import { PublicationService } from '../../../core/services/publication.service';
import { NotificationService } from '../../../core/services/notification.service';
import type { User } from '../../../core/models/user.model';
import type { Publication } from '../../../core/models/publication.model';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';
import { PublicationCardComponent } from '../../../shared/components/publication-card/publication-card.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { PublicationCardSkeletonComponent } from '../../../shared/components/publication-card-skeleton/publication-card-skeleton.component';
import { InfiniteScrollDirective } from '../../../shared/directives/infinite-scroll.directive';
import { EnterAnimationDirective } from '../../../shared/directives/enter-animation.directive';
import { PressScaleDirective } from '../../../shared/directives/press-scale.directive';
import { ProfileParallaxDirective } from '../../../shared/directives/profile-parallax.directive';
import { EditProfileModalComponent } from '../edit-profile-modal/edit-profile-modal.component';
import { FollowersModalComponent } from '../followers-modal/followers-modal.component';
import { FollowButtonComponent } from '../../../shared/components/follow-button/follow-button.component';
import { ConversationService } from '../../../core/services/conversation.service';

type ProfileTab = 'publications' | 'media' | 'likes';

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
    PageHeaderComponent,
    PublicationCardSkeletonComponent,
    InfiniteScrollDirective,
    EnterAnimationDirective,
    PressScaleDirective,
    ProfileParallaxDirective,
    EditProfileModalComponent,
    FollowersModalComponent,
    FollowButtonComponent
  ],
  templateUrl: './profile-page.component.html',
  styleUrl: './profile-page.component.scss'
})
export class ProfilePageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly userService = inject(UserService);
  private readonly publicationService = inject(PublicationService);
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
  private readonly conversationService = inject(ConversationService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly hostRef = inject(ElementRef<HTMLElement>);

  profile: User | null = null;
  publications: Publication[] = [];
  mediaPublications: Publication[] = [];
  likedPublications: Publication[] = [];
  private lastProfileUserId = '';
  loadingProfile = true;
  loadingPublications = false;
  loadingMedia = false;
  loadingLikes = false;
  loadingMorePublications = false;
  loadingMoreMedia = false;
  publicationsHasMore = false;
  mediaHasMore = false;
  private publicationsPage = 1;
  private mediaPage = 1;
  profileError = false;
  profileNotFound = false;
  contentLoadError = false;
  publicationsLoadMoreError = false;
  mediaLoadMoreError = false;
  privateAccount = false;
  togglingFollow = false;
  openingMessage = false;
  messageError = '';
  processingFollowRequest = false;
  showIncomingFollowRequest = false;
  editModalOpen = false;
  followersModalOpen = false;
  followersModalMode: 'followers' | 'following' = 'followers';
  activeTab: ProfileTab = 'publications';
  currentUserId?: string;
  private profileRequestId = 0;
  private publicationsRequestId = 0;
  private mediaRequestId = 0;
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

    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      this.showIncomingFollowRequest = params.get('pedido') === '1';
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
    this.publicationsLoadMoreError = false;
    this.mediaLoadMoreError = false;
    this.privateAccount = false;
    this.publications = [];
    this.mediaPublications = [];
    this.likedPublications = [];
    this.publicationsPage = 1;
    this.mediaPage = 1;
    this.publicationsHasMore = false;
    this.mediaHasMore = false;
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
        this.showIncomingFollowRequest =
          this.showIncomingFollowRequest || profile.hasIncomingFollowRequest === true;

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
    this.publicationsLoadMoreError = false;
    this.mediaLoadMoreError = false;
    if (this.activeTab === 'likes') {
      this.loadLikedPublications(this.profile.id);
    } else if (this.activeTab === 'media') {
      this.loadMediaPublications(this.profile.id, true);
    } else {
      this.loadPublications(this.profile.id, true);
    }
  }

  loadPublications(userId: string, reset = true): void {
    if (reset) {
      this.publicationsPage = 1;
      this.publications = [];
      this.publicationsHasMore = false;
    }

    const requestId = ++this.publicationsRequestId;
    this.loadingPublications = reset;
    this.loadingMorePublications = !reset;
    this.privateAccount = false;
    this.contentLoadError = false;
    if (reset) {
      this.publicationsLoadMoreError = false;
    }

    this.publicationService
      .getByUser(userId, this.publicationsPage)
      .pipe(
        finalize(() => {
          if (requestId !== this.publicationsRequestId) {
            return;
          }

          this.loadingPublications = false;
          this.loadingMorePublications = false;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: response => {
          if (requestId !== this.publicationsRequestId) {
            return;
          }

          const merged = reset
            ? response.items
            : this.mergePublications(this.publications, response.items);

          this.publications = this.sortByDate(merged);
          this.publicationsHasMore = response.hasMore;
        },
        error: (error: HttpErrorResponse) => {
          if (requestId !== this.publicationsRequestId) {
            return;
          }

          if (reset) {
            this.publications = [];
            if (error.status === 403) {
              this.privateAccount = true;
            } else {
              this.contentLoadError = true;
            }
            return;
          }

          this.publicationsPage = Math.max(1, this.publicationsPage - 1);
          this.publicationsLoadMoreError = true;
        }
      });
  }

  loadMediaPublications(userId: string, reset = true): void {
    if (reset) {
      this.mediaPage = 1;
      this.mediaPublications = [];
      this.mediaHasMore = false;
    }

    const requestId = ++this.mediaRequestId;
    this.loadingMedia = reset;
    this.loadingMoreMedia = !reset;
    this.privateAccount = false;
    this.contentLoadError = false;
    if (reset) {
      this.mediaLoadMoreError = false;
    }

    this.publicationService
      .getByUser(userId, this.mediaPage, undefined, true)
      .pipe(
        finalize(() => {
          if (requestId !== this.mediaRequestId) {
            return;
          }

          this.loadingMedia = false;
          this.loadingMoreMedia = false;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: response => {
          if (requestId !== this.mediaRequestId) {
            return;
          }

          const merged = reset
            ? response.items
            : this.mergePublications(this.mediaPublications, response.items);

          this.mediaPublications = this.sortByDate(merged);
          this.mediaHasMore = response.hasMore;
        },
        error: (error: HttpErrorResponse) => {
          if (requestId !== this.mediaRequestId) {
            return;
          }

          if (reset) {
            this.mediaPublications = [];
            if (error.status === 403) {
              this.privateAccount = true;
            } else {
              this.contentLoadError = true;
            }
            return;
          }

          this.mediaPage = Math.max(1, this.mediaPage - 1);
          this.mediaLoadMoreError = true;
        }
      });
  }

  loadMorePublications(): void {
    if (!this.profile || this.loadingPublications || this.loadingMorePublications || !this.publicationsHasMore) {
      return;
    }

    this.publicationsPage += 1;
    this.loadPublications(this.profile.id, false);
  }

  loadMoreMedia(): void {
    if (!this.profile || this.loadingMedia || this.loadingMoreMedia || !this.mediaHasMore) {
      return;
    }

    this.mediaPage += 1;
    this.loadMediaPublications(this.profile.id, false);
  }

  loadLikedPublications(userId: string): void {
    const requestId = ++this.likesRequestId;
    this.loadingLikes = true;
    this.privateAccount = false;
    this.contentLoadError = false;
    this.publicationsLoadMoreError = false;
    this.mediaLoadMoreError = false;

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
    this.mediaPublications = this.mediaPublications.map(patchAuthor);
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

        if (this.profile.hasIncomingFollowRequest) {
          this.profile = {
            ...this.profile,
            hasIncomingFollowRequest: false,
            isFollowing: true,
            isPending: false
          };
          this.showIncomingFollowRequest = false;
          this.loadPublications(this.profile.id);
        }

        this.togglingFollow = false;
      },
      error: () => {
        this.togglingFollow = false;
      }
    });
  }

  handleOpenMessage(): void {
    if (!this.profile || this.isOwnProfile || this.openingMessage) {
      return;
    }

    this.openingMessage = true;
    this.messageError = '';

    this.conversationService
      .getOrCreateConversation(this.profile.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: conversation => {
          this.openingMessage = false;
          void this.router.navigate(['/messages', conversation.id]);
        },
        error: (error: HttpErrorResponse) => {
          this.openingMessage = false;
          this.messageError = error.error?.message ?? 'Não foi possível abrir a conversa.';
        }
      });
  }

  handleApproveIncomingRequest(): void {
    if (!this.profile || this.processingFollowRequest) {
      return;
    }

    this.processingFollowRequest = true;

    this.userService
      .approveFollowRequest(this.profile.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
      next: () => {
        if (!this.profile) {
          return;
        }

        this.profile = {
          ...this.profile,
          hasIncomingFollowRequest: false
        };
        this.showIncomingFollowRequest = false;
        this.processingFollowRequest = false;
        this.notificationService.refreshUnreadCount().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
      },
      error: () => {
        this.processingFollowRequest = false;
      }
    });
  }

  handleRejectIncomingRequest(): void {
    if (!this.profile || this.processingFollowRequest) {
      return;
    }

    this.processingFollowRequest = true;

    this.userService
      .rejectFollowRequest(this.profile.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
      next: () => {
        if (!this.profile) {
          return;
        }

        this.profile = {
          ...this.profile,
          hasIncomingFollowRequest: false
        };
        this.showIncomingFollowRequest = false;
        this.processingFollowRequest = false;
        this.notificationService.refreshUnreadCount().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
      },
      error: () => {
        this.processingFollowRequest = false;
      }
    });
  }

  setActiveTab(tab: ProfileTab): void {
    if (tab === this.activeTab) {
      return;
    }

    const scrollContainer = this.getScrollContainer();
    const scrollTop = scrollContainer?.scrollTop ?? 0;

    this.activeTab = tab;

    if (!this.profile || !this.canViewPublications) {
      this.restoreScrollPosition(scrollContainer, scrollTop);
      return;
    }

    if (tab === 'likes' && this.likedPublications.length === 0 && !this.loadingLikes) {
      this.loadLikedPublications(this.profile.id);
      this.restoreScrollPosition(scrollContainer, scrollTop);
      return;
    }

    if (tab === 'media' && this.mediaPublications.length === 0 && !this.loadingMedia) {
      this.loadMediaPublications(this.profile.id, true);
    }

    this.restoreScrollPosition(scrollContainer, scrollTop);
  }

  handleTabClick(event: MouseEvent, tab: ProfileTab): void {
    event.preventDefault();
    (event.currentTarget as HTMLButtonElement | null)?.blur();
    this.setActiveTab(tab);
  }

  private getScrollContainer(): HTMLElement | null {
    return document.querySelector('.main-layout__center');
  }

  private restoreScrollPosition(scrollContainer: HTMLElement | null, scrollTop: number): void {
    if (!scrollContainer) {
      return;
    }

    const tabsElement = this.hostRef.nativeElement.querySelector('.profile-page__tabs') as HTMLElement | null;
    const anchorTop = tabsElement
      ? tabsElement.getBoundingClientRect().top -
        scrollContainer.getBoundingClientRect().top +
        scrollContainer.scrollTop
      : scrollTop;
    const nextScrollTop = Math.max(scrollTop, anchorTop);

    requestAnimationFrame(() => {
      scrollContainer.scrollTop = nextScrollTop;
      requestAnimationFrame(() => {
        scrollContainer.scrollTop = nextScrollTop;
      });
    });
  }

  handlePublicationDeleted(id: string): void {
    this.publications = this.publications.filter(publication => publication.id !== id);
    this.mediaPublications = this.mediaPublications.filter(publication => publication.id !== id);
    this.likedPublications = this.likedPublications.filter(publication => publication.id !== id);
  }

  handlePublicationUpdated(publication: Publication): void {
    this.publications = this.publications.map(item =>
      item.id === publication.id ? publication : item
    );
    this.mediaPublications = this.mediaPublications.map(item =>
      item.id === publication.id ? publication : item
    );
    this.likedPublications = this.likedPublications.map(item =>
      item.id === publication.id ? publication : item
    );
  }

  trackById(_: number, publication: Publication): string {
    return publication.id;
  }

  private mergePublications(existing: Publication[], incoming: Publication[]): Publication[] {
    const seen = new Set(existing.map(item => item.id));
    const appended = incoming.filter(item => !seen.has(item.id));
    return [...existing, ...appended];
  }

  private sortByDate(publications: Publication[]): Publication[] {
    return [...publications].sort(
      (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
    );
  }
}
