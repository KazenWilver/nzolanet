import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { catchError, map } from 'rxjs/operators';
import { of } from 'rxjs';
import { environment } from '../../../environments/environment';

export const adminGuard: CanActivateFn = () => {
  const router = inject(Router);
  const http = inject(HttpClient);

  // Verificar se existe um token separado de administrador
  const adminToken = localStorage.getItem('admin_token');
  if (!adminToken) {
    router.navigate(['/admin-login']);
    return false;
  }

  // Verificação server-side: endpoint que retorna 200 apenas para admins autenticados com admin_token
  const headers = { Authorization: `Bearer ${adminToken}` };
  return http.get(`${environment.apiUrl}/admin/verify-access`, { headers }).pipe(
    map(() => true),
    catchError(() => {
      localStorage.removeItem('admin_token');
      router.navigate(['/admin-login']);
      return of(false);
    })
  );
};

