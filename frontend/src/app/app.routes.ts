import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { adminGuard } from './core/guards/admin.guard';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { PublicLayoutComponent } from './layouts/public-layout/public-layout.component';

export const routes: Routes = [
  {
    path: '',
    component: PublicLayoutComponent,
    canActivate: [guestGuard],
    children: [
      { path: '', redirectTo: 'login', pathMatch: 'full' },
      {
        path: 'login',
        loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
      },
      {
        path: 'register',
        loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent)
      },
      {
        path: 'forgot-password',
        loadComponent: () =>
          import('./features/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent)
      }
    ]
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'feed',
        loadComponent: () =>
          import('./features/feed/feed-page/feed-page.component').then(m => m.FeedPageComponent)
      },
      {
        path: 'profile/me',
        loadComponent: () =>
          import('./features/profile/profile-me-redirect.component').then(m => m.ProfileMeRedirectComponent)
      },
      {
        path: 'profile/:id',
        loadComponent: () =>
          import('./features/profile/profile-page/profile-page.component').then(m => m.ProfilePageComponent)
      },
      {
        path: 'settings',
        loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent)
      },
      {
        path: 'search',
        loadComponent: () =>
          import('./features/search/search-page.component').then(m => m.SearchPageComponent)
      },
      { path: 'pesquisar', redirectTo: 'search', pathMatch: 'full' },
      { path: 'perfil/me', redirectTo: 'profile/me', pathMatch: 'full' },
      {
        path: 'notifications',
        loadComponent: () =>
          import('./features/placeholder/placeholder-page.component').then(m => m.PlaceholderPageComponent),
        data: { featureName: 'Notificações' }
      },
      {
        path: 'messages',
        loadComponent: () =>
          import('./features/placeholder/placeholder-page.component').then(m => m.PlaceholderPageComponent),
        data: { featureName: 'Mensagens' }
      },
      { path: 'notificacoes', redirectTo: 'notifications', pathMatch: 'full' },
      { path: 'publicacoes/:id/editar', redirectTo: 'feed', pathMatch: 'full' },
      { path: 'publicacoes/:id', redirectTo: 'feed', pathMatch: 'full' },
      { path: 'publicacoes', redirectTo: 'feed', pathMatch: 'full' }
    ]
  },
  {
    path: 'auth',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'auth/login',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'auth/registar',
    redirectTo: 'register',
    pathMatch: 'full'
  },
  {
    path: 'auth/recuperar-senha',
    redirectTo: 'forgot-password',
    pathMatch: 'full'
  },
  {
    path: 'admin-login',
    loadComponent: () =>
      import('./features/admin/admin-login/admin-login.component').then(m => m.AdminLoginComponent)
  },
  {
    path: 'admin-portal-9f3b1c',
    loadComponent: () =>
      import('./features/admin/admin-layout/admin-layout.component').then(m => m.AdminLayoutComponent),
    canActivate: [adminGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/admin/admin-page/admin-page.component').then(m => m.AdminPageComponent)
      }
    ]
  },
  { path: '**', redirectTo: '/feed' }
];
