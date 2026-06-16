import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { PostService } from '../../core/services/post.service';
import { UserService } from '../../core/services/user.service';
import { Post } from '../../core/models/post.model';
import { User } from '../../core/models/user.model';
import { PostCardComponent } from '../../shared/components/post-card/post-card.component';
import { UserAvatarComponent } from '../../shared/components/user-avatar/user-avatar.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-search-page',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, PostCardComponent, UserAvatarComponent, LoadingSpinnerComponent],
  templateUrl: './search-page.component.html',
  styleUrl: './search-page.component.scss'
})
export class SearchPageComponent implements OnInit {
  termo = '';
  posts: Post[] = [];
  utilizadores: User[] = [];
  aCarregar = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private postService: PostService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      const termo = params.get('q')?.trim() ?? '';
      this.termo = termo;
      this.posts = [];
      this.utilizadores = [];
      if (termo) {
        this.fazerPesquisa(termo);
      }
    });
  }

  pesquisar(): void {
    const termo = this.termo.trim();
    this.router.navigate(['/pesquisar'], {
      queryParams: termo ? { q: termo } : {}
    });
    if (!termo) {
      this.posts = [];
      this.utilizadores = [];
    }
  }

  fazerPesquisa(termo: string): void {
    this.aCarregar = true;
    forkJoin({
      posts: this.postService.pesquisar(termo),
      users: this.userService.pesquisar(termo)
    }).subscribe({
      next: ({ posts, users }) => {
        this.posts = posts;
        this.utilizadores = users;
        this.aCarregar = false;
      },
      error: () => {
        this.posts = [];
        this.utilizadores = [];
        this.aCarregar = false;
      }
    });
  }

  trackPorId(_: number, post: Post): string {
    return post.id;
  }
}
