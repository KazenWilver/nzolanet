import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { LoginDto } from '../../../core/models/user.model';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

interface ContaSalva {
  email: string;
  nome: string;
  fotoPerfil?: string;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LoadingSpinnerComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  credenciais: LoginDto = { email: '', senha: '' };
  senhaVisivel = false;
  aEntrar = false;
  erroGeral = '';
  contasSalvas: ContaSalva[] = [];
  contaSelecionada: ContaSalva | null = null;
  modoOutraConta = false;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.carregarContasSalvas();
  }

  carregarContasSalvas(): void {
    const contas = localStorage.getItem('nzolanet_contas_salvas');
    this.contasSalvas = contas ? JSON.parse(contas) : [];
  }

  selecionarConta(conta: ContaSalva): void {
    this.contaSelecionada = conta;
    this.modoOutraConta = false;
    this.credenciais.email = conta.email;
    this.credenciais.senha = '';
    this.senhaVisivel = false;
    this.erroGeral = '';
  }

  usarOutraConta(): void {
    this.modoOutraConta = true;
    this.contaSelecionada = null;
    this.credenciais.email = '';
    this.credenciais.senha = '';
    this.erroGeral = '';
  }

  voltarContas(): void {
    this.modoOutraConta = false;
    this.credenciais.email = '';
    this.credenciais.senha = '';
    this.erroGeral = '';
  }

  cancelarConta(): void {
    this.contaSelecionada = null;
    this.credenciais.email = '';
    this.credenciais.senha = '';
    this.erroGeral = '';
  }

  entrar(): void {
    this.erroGeral = '';
    this.aEntrar = true;
    this.authService.login(this.credenciais).subscribe({
      next: () => this.router.navigate(['/feed']),
      error: (err: any) => {
        this.aEntrar = false;
        this.erroGeral = err.status === 401 ? 'Email ou senha incorrectos.' : 'Erro ao entrar. Tenta novamente.';
      }
    });
  }
}