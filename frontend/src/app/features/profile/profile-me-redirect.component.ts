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
    const utilizador = this.authService.obterUtilizadorAtual();
    if (utilizador?.id) {
      this.router.navigate(['/perfil', utilizador.id]);
    } else {
      this.router.navigate(['/auth/login']);
    }
  }
}
