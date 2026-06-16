import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PostService } from '../../core/services/post.service';
import { Post } from '../../core/models/post.model';
import { PostCardComponent } from '../../shared/components/post-card/post-card.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-search-page',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, PostCardComponent, LoadingSpinnerComponent],
  templateUrl: './search-page.component.html',
  styleUrl: './search-page.component.scss'
})
export class SearchPageComponent implements OnInit {
  termo = '';
  posts: Post[] = [];
  aCarregar = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private postService: PostService
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      const termo = params.get('q')?.trim() ?? '';
      this.termo = termo;
      this.posts = [];
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
    }
  }

  fazerPesquisa(termo: string): void {
    this.aCarregar = true;
    this.postService.pesquisar(termo).subscribe({
      next: posts => {
        this.posts = posts;
        this.aCarregar = false;
      },
      error: () => { this.posts = []; this.aCarregar = false; }
    });
  }

  trackPorId(_: number, post: Post): string {
    return post.id;
  }
}
