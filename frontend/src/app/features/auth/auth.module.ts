import { Routes } from '@angular/router';
import { guestGuard } from '../../core/guards/guest.guard';

// Rotas do módulo de autenticação — protegidas pelo guestGuard para impedir
// que utilizadores já autenticados acedam às páginas de login/registo
export const authRoutes: Routes = [
  {
    path: '',
    canActivate: [guestGuard],
    children: [
      { path: 'login',            loadComponent: () => import('./login/login.component').then(m => m.LoginComponent) },
      { path: 'registar',         loadComponent: () => import('./register/register.component').then(m => m.RegisterComponent) },
      { path: 'recuperar-senha',  loadComponent: () => import('./forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent) },
      { path: '', redirectTo: 'login', pathMatch: 'full' }
    ]
  }
];