import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LoadingSpinnerComponent],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss'
})
export class ForgotPasswordComponent {
  email = '';
  aEnviar = false;
  enviado = false;

  constructor(private authService: AuthService) {}

  enviar(): void {
    if (!this.email.trim()) return;
    this.aEnviar = true;
    this.authService.recuperarSenha({ email: this.email }).subscribe({
      next: () => { this.enviado = true; this.aEnviar = false; },
      error: () => {
        // Mostra sempre sucesso por segurança — não revelar se o email existe no sistema
        this.enviado = true;
        this.aEnviar = false;
      }
    });
  }
}