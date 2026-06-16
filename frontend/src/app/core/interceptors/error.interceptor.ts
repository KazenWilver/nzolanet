import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

// Interceptor de erros HTTP: tratamento centralizado para não repetir lógica em cada componente
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const auth = inject(AuthService);

  return next(req).pipe(
    catchError((erro: HttpErrorResponse) => {
      // 401 = token inválido ou expirado → terminar sessão e redirecionar para login
      if (erro.status === 401) auth.terminarSessao();
      // 403 = autenticado mas sem permissão → redirecionar para o feed
      if (erro.status === 403) router.navigate(['/feed']);
      return throwError(() => erro);
    })
  );
};