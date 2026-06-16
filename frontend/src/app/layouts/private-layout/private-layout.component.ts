import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { SidebarNavComponent } from '../../shared/components/sidebar-nav/sidebar-nav.component';
import { SidebarSugestoesComponent } from '../../shared/components/sidebar-sugestoes/sidebar-sugestoes.component';

@Component({
  selector: 'app-private-layout',
  standalone: true,
  imports: [RouterModule, NavbarComponent, SidebarNavComponent, SidebarSugestoesComponent],
  templateUrl: './private-layout.component.html',
  styleUrl: './private-layout.component.scss'
})
export class PrivateLayoutComponent {}