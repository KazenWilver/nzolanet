import { Routes } from '@angular/router';

export const profileRoutes: Routes = [
  { path: ':id',           loadComponent: () => import('./profile-page/profile-page.component').then(m => m.ProfilePageComponent) },
  { path: ':id/editar',    loadComponent: () => import('./edit-profile/edit-profile.component').then(m => m.EditProfileComponent) },
  { path: ':id/seguidores',loadComponent: () => import('./followers-list/followers-list.component').then(m => m.FollowersListComponent) },
  { path: ':id/seguindo',  loadComponent: () => import('./followers-list/followers-list.component').then(m => m.FollowersListComponent) }
];