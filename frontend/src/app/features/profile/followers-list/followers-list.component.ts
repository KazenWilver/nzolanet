import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../../../core/services/user.service';
import { User } from '../../../core/models/user.model';
import { UserAvatarComponent } from '../../../shared/components/user-avatar/user-avatar.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-followers-list',
  standalone: true,
  imports: [CommonModule, RouterModule, UserAvatarComponent, LoadingSpinnerComponent],
  templateUrl: './followers-list.component.html',
  styleUrl: './followers-list.component.scss'
})
export class FollowersListComponent implements OnInit {
  utilizadores: User[] = [];
  modo: 'seguidores' | 'seguindo' = 'seguidores';
  aCarregar = true;
  private utilizadorId!: number;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.utilizadorId = Number(this.route.snapshot.paramMap.get('id'));
    // Determina o modo pelo último segmento da rota actual
    const segmento = this.route.snapshot.url[this.route.snapshot.url.length - 1]?.path;
    this.modo = segmento === 'seguindo' ? 'seguindo' : 'seguidores';
    this.carregar();
  }

  trocarModo(modo: 'seguidores' | 'seguindo'): void {
    this.modo = modo;
    this.carregar();
  }

  carregar(): void {
    this.aCarregar = true;
    const pedido = this.modo === 'seguidores'
      ? this.userService.obterSeguidores(this.utilizadorId)
      : this.userService.obterSeguindo(this.utilizadorId);

    pedido.subscribe({
      next: (lista: User[]) => { this.utilizadores = lista; this.aCarregar = false; },
      error: () => { this.aCarregar = false; }
    });
  }

  voltar(): void { this.router.navigate(['/perfil', this.utilizadorId]); }
}