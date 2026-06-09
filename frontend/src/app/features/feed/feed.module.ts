import { Routes } from '@angular/router';

export const feedRoutes: Routes = [
  { path: '', loadComponent: () => import('./feed-page/feed-page.component').then(m => m.FeedPageComponent) }
];