import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.getToken();

  const hasAuthHeader = req.headers.has('Authorization');

  // Admin requests carry their own token (managed by AdminAuthService) and must
  // stay isolated from the regular user session: never attach the user token to
  // them, and never sign the user out because of an admin 401.
  const isAdminApi = req.url.includes('/admin/') || req.url.endsWith('/admin');

  const authReq =
    !hasAuthHeader && token && !isAdminApi
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

  const isAuthLogin = req.url.includes('/auth/login') || req.url.includes('/auth/register');

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !isAuthLogin && !isAdminApi) {
        auth.logout({ sessionExpired: true });
      }
      return throwError(() => error);
    })
  );
};
