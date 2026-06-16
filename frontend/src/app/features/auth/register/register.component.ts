import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { RegistoDto } from '../../../core/models/user.model';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LoadingSpinnerComponent],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  dados: RegistoDto = { nome: '', nomeUtilizador: '', email: '', senha: '', confirmarSenha: '' };
  senhaVisivel = false;
  aRegistar = false;
  erroGeral = '';

  constructor(private authService: AuthService, private router: Router) {}

  senhasNaoCoincidem(): boolean {
    return !!this.dados.confirmarSenha && this.dados.senha !== this.dados.confirmarSenha;
  }

  temMaiuscula(): boolean {
    return /[A-Z]/.test(this.dados.senha);
  }

  temMinuscula(): boolean {
    return /[a-z]/.test(this.dados.senha);
  }

  temNumero(): boolean {
    return /[0-9]/.test(this.dados.senha);
  }

  temTamanhoMinimo(): boolean {
    return this.dados.senha.length >= 6;
  }

  senhaValida(): boolean {
    return this.temMaiuscula() && this.temMinuscula() && this.temNumero() && this.temTamanhoMinimo();
  }

  registar(): void {
    if (this.senhasNaoCoincidem() || !this.senhaValida()) return;
    this.erroGeral = '';
    this.aRegistar = true;
    this.authService.registar(this.dados).subscribe({
      next: () => this.router.navigate(['/feed']),
      error: (err: any) => {
        this.aRegistar = false;
        this.erroGeral = err.error?.mensagem ?? 'Erro ao criar conta. Tenta novamente.';
      }
    });
  }
}