import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { UserAvatarComponent } from '../user-avatar/user-avatar.component';

@Component({
  selector: 'app-sidebar-nav',
  standalone: true,
  imports: [CommonModule, RouterModule, UserAvatarComponent],
  templateUrl: './sidebar-nav.component.html',
  styleUrl: './sidebar-nav.component.scss'
})
export class SidebarNavComponent implements OnInit {
  menuItems = [
    { icon: 'home', label: 'Feed', route: '/feed', active: true },
    { icon: 'search', label: 'Pesquisar', route: '/pesquisar', active: false },
    { icon: 'bell', label: 'Notificações', route: '/notificacoes', active: false },
    { icon: 'user', label: 'Perfil', route: '/perfil/me', active: false },
  ];

  amigosOnline = [
    { id: 'm1', nome: 'António Nzola', fotoPerfil: undefined },
    { id: 'm2', nome: 'Bela Kiala', fotoPerfil: undefined },
    { id: 'm3', nome: 'Carlos Mwene', fotoPerfil: undefined },
    { id: 'm4', nome: 'Deolinda Neto', fotoPerfil: undefined }
  ];

  constructor(private sanitizer: DomSanitizer) { }

  ngOnInit(): void {
  }

  getIconSvg(iconName: string): SafeHtml {
    const icons: { [key: string]: string } = {
      home: '<path d="M3 12l9-9 9 9M5 10v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-10"/>',
      users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
      search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>',
      bell: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
      user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    };
    return this.sanitizer.bypassSecurityTrustHtml(icons[iconName] || '');
  }
}
