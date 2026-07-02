import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.scss'
})
export class AdminLayoutComponent {
  constructor(
    private authService: AuthService,
    readonly themeService: ThemeService
  ) {}

  handleLogout(): void {
    this.authService.logout();
  }

  handleToggleTheme(): void {
    this.themeService.toggleTheme();
  }
}
