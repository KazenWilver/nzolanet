import { inject } from '@angular/core'
import { CanActivateFn, Router } from '@angular/router'
import { map } from 'rxjs/operators'
import { AdminAuthService } from '../services/admin-auth.service'

/**
 * Protects the administrator area: requires a valid administrator token and
 * confirms with the backend that the caller still holds the Admin role.
 */
export const adminGuard: CanActivateFn = () => {
  const adminAuth = inject(AdminAuthService)
  const router = inject(Router)

  if (!adminAuth.isAuthenticated()) {
    void router.navigate(['/admin/login'])
    return false
  }

  return adminAuth.verifyAccess().pipe(
    map(hasAccess => {
      if (hasAccess) {
        return true
      }

      void router.navigate(['/admin/login'])
      return false
    }),
  )
}
