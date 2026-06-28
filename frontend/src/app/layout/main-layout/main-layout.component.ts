import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';
import { AsideComponent } from '../aside/aside.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { CreatePostComponent } from '../../features/feed/create-post/create-post.component';
import { PublishModalService } from '../../core/services/publish-modal.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterModule, SidebarComponent, TopbarComponent, AsideComponent, ModalComponent, CreatePostComponent],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss'
})
export class MainLayoutComponent {
  private readonly router = inject(Router);
  readonly publishModal = inject(PublishModalService);

  handleClosePublishModal(): void {
    this.publishModal.close();
  }

  handlePostCreated(): void {
    this.publishModal.close();
    if (!this.router.url.startsWith('/feed')) {
      void this.router.navigate(['/feed']);
    }
  }
}
