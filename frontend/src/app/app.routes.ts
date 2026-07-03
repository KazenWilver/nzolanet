import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { adminGuard } from './core/guards/admin.guard';
import { adminGuestGuard } from './core/guards/admin-guest.guard';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { PublicLayoutComponent } from './layouts/public-layout/public-layout.component';

export const routes: Routes = [
  {
    path: 'admin/login',
    canActivate: [adminGuestGuard],
    loadComponent: () =>
      import('./features/admin/admin-login/admin-login.component').then(m => m.AdminLoginComponent)
  },
  {
    path: 'admin/register',
    canActivate: [adminGuestGuard],
    loadComponent: () =>
      import('./features/admin/admin-register/admin-register.component').then(m => m.AdminRegisterComponent)
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./features/admin/admin-layout/admin-layout.component').then(m => m.AdminLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/admin/admin-dashboard/admin-dashboard.component').then(
            m => m.AdminDashboardComponent
          )
      }
    ]
  },
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
      },
      {
        path: 'reset-password',
        loadComponent: () =>
          import('./features/auth/reset-password/reset-password.component').then(m => m.ResetPasswordComponent)
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
        path: 'welcome',
        loadComponent: () =>
          import('./features/auth/auth-welcome/auth-welcome.component').then(m => m.AuthWelcomeComponent)
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
      {
        path: 'bookmarks',
        loadComponent: () =>
          import('./features/bookmarks/bookmarks-page.component').then(m => m.BookmarksPageComponent)
      },
      {
        path: 'profile/by-username/:username',
        loadComponent: () =>
          import('./features/profile/profile-by-username-redirect.component').then(m => m.ProfileByUsernameRedirectComponent)
      },
      { path: 'pesquisar', redirectTo: 'search', pathMatch: 'full' },
      { path: 'perfil/me', redirectTo: 'profile/me', pathMatch: 'full' },
      {
        path: 'notifications',
        loadComponent: () =>
          import('./features/notifications/notifications-page.component').then(m => m.NotificationsPageComponent)
      },
      {
        path: 'messages',
        loadComponent: () =>
          import('./features/messages/messages-page.component').then(m => m.MessagesPageComponent)
      },
      {
        path: 'messages/:conversationId',
        loadComponent: () =>
          import('./features/messages/messages-page.component').then(m => m.MessagesPageComponent)
      },
      {
        path: 'fimbu',
        loadComponent: () =>
          import('./features/fimbu/fimbu-page.component').then(m => m.FimbuPageComponent)
      },
      { path: 'notificacoes', redirectTo: 'notifications', pathMatch: 'full' },
      {
        path: 'publicacoes/:id',
        loadComponent: () =>
          import('./features/publication/publication-detail-page/publication-detail-page.component').then(
            m => m.PublicationDetailPageComponent
          )
      },
      { path: 'publicacoes', redirectTo: 'feed', pathMatch: 'full' },
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
  { path: '**', redirectTo: '/feed' }
];
