import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-login.component.html',
  styleUrl: './admin-login.component.scss'
})
export class AdminLoginComponent implements OnInit {
  email = '';
  senha = '';
  carregando = false;
  mensagemErro = '';
  mostrarSenha = false;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Se já houver token admin, redireciona para o painel
    if (localStorage.getItem('admin_token')) {
      this.router.navigate(['/admin-portal-9f3b1c']);
    }
  }

  entrar(): void {
    if (!this.email || !this.senha) {
      this.mensagemErro = 'Por favor, preencha todos os campos.';
      return;
    }

    this.carregando = true;
    this.mensagemErro = '';

    this.http.post<{ token: string }>(`${environment.apiUrl}/admin/login`, {
      email: this.email,
      senha: this.senha
    }).subscribe({
      next: (resposta) => {
        localStorage.setItem('admin_token', resposta.token);
        this.router.navigate(['/admin-portal-9f3b1c']);
      },
      error: (err) => {
        this.carregando = false;
        this.mensagemErro = err.error?.message || 'Erro ao fazer login. Verifique as credenciais.';
      }
    });
  }

  alternarMostrarSenha(): void {
    this.mostrarSenha = !this.mostrarSenha;
  }

  voltarParaApp(): void {
    this.router.navigate(['/feed']);
  }
}
