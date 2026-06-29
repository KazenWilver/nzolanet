import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.getToken();

  const isAdminRoute = req.url.includes('/admin');
  const hasAuthHeader = req.headers.has('Authorization');

  const authReq =
    !isAdminRoute && !hasAuthHeader && token
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

  const isAuthLogin = req.url.includes('/auth/login') || req.url.includes('/auth/register');
  const isAdminLogin = req.url.includes('/admin/login');

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !isAuthLogin && !isAdminLogin) {
        auth.logout({ sessionExpired: true });
      }
      return throwError(() => error);
    })
  );
};
