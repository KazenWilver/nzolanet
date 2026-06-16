import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

// Guard funcional que protege todas as rotas privadas (private-layout)
// Se o utilizador não estiver autenticado, redireciona para o login
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.estaAutenticado()) return true;

  router.navigate(['/auth/login']);
  return false;
};