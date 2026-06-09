import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import { PublicLayoutComponent } from './layouts/public-layout/public-layout.component';
import { PrivateLayoutComponent } from './layouts/private-layout/private-layout.component';

// Rotas principais com lazy loading por módulo de funcionalidade.
// Dois layouts: público (auth) sem navbar e privado (app) com navbar.
export const routes: Routes = [
  {
    // Rotas públicas — acessíveis sem autenticação
    path: 'auth',
    component: PublicLayoutComponent,
    loadChildren: () => import('./features/auth/auth.module').then(m => m.authRoutes)
  },
  {
    // Login do administrador — rota pública para acesso admin separado
    path: 'admin-login',
    loadComponent: () => import('./features/admin/admin-login/admin-login.component').then(m => m.AdminLoginComponent)
  },
  {
    // Rotas privadas — protegidas pelo authGuard
    path: '',
    component: PrivateLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'feed',        loadChildren: () => import('./features/feed/feed.module').then(m => m.feedRoutes) },
      { path: 'pesquisar',   loadComponent: () => import('./features/search/search-page.component').then(m => m.SearchPageComponent) },
      { path: 'notificacoes',loadComponent: () => import('./features/notifications/notifications-page.component').then(m => m.NotificationsPageComponent) },
      { path: 'perfil/me',   loadComponent: () => import('./features/profile/profile-me-redirect.component').then(m => m.ProfileMeRedirectComponent) },
      { path: 'perfil',      loadChildren: () => import('./features/profile/profile.module').then(m => m.profileRoutes) },
      { path: 'publicacoes', loadChildren: () => import('./features/posts/posts.module').then(m => m.postsRoutes) },
      { path: '', redirectTo: 'feed', pathMatch: 'full' }
    ]
  },
  {
    // Rota admin oculta: apenas protegido pelo token de administrador
    path: 'admin-portal-9f3b1c',
    loadComponent: () => import('./features/admin/admin-layout/admin-layout.component').then(m => m.AdminLayoutComponent),
    canActivate: [adminGuard],
    children: [
      { path: '', loadComponent: () => import('./features/admin/admin-page/admin-page.component').then(m => m.AdminPageComponent) }
    ]
  },
  { path: '**', redirectTo: '/feed' }
];