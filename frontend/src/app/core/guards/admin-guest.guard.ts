import { inject } from '@angular/core'
import { CanActivateFn, Router } from '@angular/router'
import { AdminAuthService } from '../services/admin-auth.service'

/**
 * Keeps already authenticated administrators away from the login and register
 * screens, sending them straight to the dashboard.
 */
export const adminGuestGuard: CanActivateFn = () => {
  const adminAuth = inject(AdminAuthService)
  const router = inject(Router)

  if (!adminAuth.isAuthenticated()) {
    return true
  }

  void router.navigate(['/admin'])
  return false
}
