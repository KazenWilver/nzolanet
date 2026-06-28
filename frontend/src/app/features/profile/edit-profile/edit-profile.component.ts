import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import { LegacyUser } from '../../../core/models/user.model';
import { UserAvatarComponent } from '../../../shared/components/user-avatar/user-avatar.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

interface FormPerfil {
  nome: string;
  nomeUtilizador: string;
  bio: string;
  localizacao: string;
  privado: boolean;
}

@Component({
  selector: 'app-edit-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, UserAvatarComponent, LoadingSpinnerComponent],
  templateUrl: './edit-profile.component.html',
  styleUrl: './edit-profile.component.scss'
})
export class EditProfileComponent implements OnInit {
  utilizador: LegacyUser | null = null;
  formDados: FormPerfil = { nome: '', nomeUtilizador: '', bio: '', localizacao: '', privado: false };
  fotoSelecionada: File | null = null;
  previsaoFoto: string | null = null;
  aGuardar = false;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.utilizador$.subscribe((u: LegacyUser | null) => {
      if (!u) return;
      this.utilizador = u;
      this.formDados = {
        nome: u.nome,
        nomeUtilizador: u.nomeUtilizador,
        bio: u.bio ?? '',
        localizacao: u.localizacao ?? '',
        privado: u.privado || false
      };
    });
  }

  selecionarFoto(evento: Event): void {
    const input = evento.target as HTMLInputElement;
    if (!input.files?.length) return;
    this.fotoSelecionada = input.files[0];
    if (this.previsaoFoto) URL.revokeObjectURL(this.previsaoFoto);
    this.previsaoFoto = URL.createObjectURL(this.fotoSelecionada);
  }

  guardar(): void {
    if (!this.utilizador) return;
    this.aGuardar = true;
    const formulario = new FormData();
    formulario.append('nome', this.formDados.nome);
    formulario.append('nomeUtilizador', this.formDados.nomeUtilizador);
    formulario.append('bio', this.formDados.bio);
    formulario.append('localizacao', this.formDados.localizacao);
    formulario.append('privado', String(this.formDados.privado));
    if (this.fotoSelecionada) formulario.append('foto', this.fotoSelecionada);

    this.userService.editarPerfil(this.utilizador.id, formulario).subscribe({
      next: (usuarioAtualizado: LegacyUser) => {
        // Atualiza a sessão local com os novos dados
        this.authService.atualizarUtilizadorAtual(usuarioAtualizado);
        this.voltar();
      },
      error: () => { this.aGuardar = false; }
    });
  }

  voltar(): void { this.router.navigate(['/perfil', this.utilizador?.id]); }
}