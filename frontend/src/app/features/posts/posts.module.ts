import { Routes } from '@angular/router';

export const postsRoutes: Routes = [
  { path: ':id',        loadComponent: () => import('./post-detail/post-detail.component').then(m => m.PostDetailComponent) },
  { path: ':id/editar', loadComponent: () => import('./edit-post/edit-post.component').then(m => m.EditPostComponent) }
];