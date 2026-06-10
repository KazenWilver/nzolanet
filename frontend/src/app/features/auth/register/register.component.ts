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

  registar(): void {
    if (this.senhasNaoCoincidem()) return;
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