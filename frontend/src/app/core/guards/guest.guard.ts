import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

// Guard funcional que protege as rotas públicas (login, registo, recuperar senha)
// Se o utilizador já estiver autenticado, redireciona directamente para o feed
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.estaAutenticado()) return true;

  router.navigate(['/feed']);
  return false;
};