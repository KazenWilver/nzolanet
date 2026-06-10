import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

// Interceptor funcional (Angular 17+): anexa automaticamente o token JWT
// no cabeçalho Authorization de todos os pedidos HTTP ao backend
export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.obterToken();

  if (token) {
    // Clona o pedido original e adiciona o cabeçalho — os pedidos HTTP são imutáveis
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }

  return next(req);
};