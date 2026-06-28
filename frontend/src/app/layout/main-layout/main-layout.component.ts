import { Component, DestroyRef, HostListener, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterModule } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';
import { AsideComponent } from '../aside/aside.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { CreatePostComponent } from '../../features/feed/create-post/create-post.component';
import { PublishModalService } from '../../core/services/publish-modal.service';
import { AccountMenuService } from '../../core/services/account-menu.service';
import { AuthService } from '../../core/services/auth.service';
import type { User } from '../../core/models/user.model';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterModule, SidebarComponent, TopbarComponent, AsideComponent, ModalComponent, CreatePostComponent],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss'
})
export class MainLayoutComponent {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  readonly publishModal = inject(PublishModalService);
  readonly accountMenu = inject(AccountMenuService);

  currentUser: User | null = null;

  constructor() {
    this.authService.currentUser$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(user => {
        this.currentUser = user;
        if (!user) {
          this.accountMenu.close();
        }
      });
  }

  get profileRoute(): string {
    return this.currentUser ? `/profile/${this.currentUser.id}` : '/profile/me';
  }

  handleClosePublishModal(): void {
    this.publishModal.close();
  }

  handlePostCreated(): void {
    this.publishModal.close();
    if (!this.router.url.startsWith('/feed')) {
      void this.router.navigate(['/feed']);
    }
  }

  handleCloseAccountMenu(): void {
    this.accountMenu.close();
  }

  handleAccountMenuNavigate(): void {
    this.accountMenu.close();
  }

  @HostListener('document:keydown.escape')
  handleEscapeKey(): void {
    if (this.accountMenu.isOpen()) {
      this.accountMenu.close();
    }
  }
}
