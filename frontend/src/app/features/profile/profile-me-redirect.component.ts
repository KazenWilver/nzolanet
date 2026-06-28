import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-profile-me-redirect',
  standalone: true,
  template: '<p>Redirecionando para o seu perfil...</p>'
})
export class ProfileMeRedirectComponent implements OnInit {
  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (user?.id) {
      void this.router.navigate(['/profile', user.id]);
    } else {
      void this.router.navigate(['/login']);
    }
  }
}
