import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { environment } from '../../../../environments/environment';

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
  devResetLink = '';
  mensagemPendente =
    'Esta funcionalidade ainda não foi implementada, mas já estamos a tratar disso.';

  readonly isProduction = environment.production;

  constructor(private authService: AuthService) {
    if (this.isProduction) {
      this.enviado = true;
    }
  }

  enviar(): void {
    if (this.isProduction) {
      this.enviado = true;
      return;
    }

    if (!this.email.trim()) return;
    this.aEnviar = true;
    this.devResetLink = '';
    this.authService.forgotPassword(this.email.trim()).subscribe({
      next: response => {
        this.enviado = true;
        this.aEnviar = false;
        if (response.devResetLink) {
          this.devResetLink = response.devResetLink;
        }
      },
      error: () => {
        this.enviado = true;
        this.aEnviar = false;
      }
    });
  }
}
