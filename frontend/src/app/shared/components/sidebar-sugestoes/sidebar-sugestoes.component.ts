import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PlaceholderFeatureComponent } from '../placeholder-feature/placeholder-feature.component';

@Component({
  selector: 'app-sidebar-sugestoes',
  standalone: true,
  imports: [FormsModule, PlaceholderFeatureComponent],
  templateUrl: './sidebar-sugestoes.component.html',
  styleUrl: './sidebar-sugestoes.component.scss'
})
export class SidebarSugestoesComponent {
  private readonly router = inject(Router);

  searchQuery = '';

  handleSearchSubmit(): void {
    const query = this.searchQuery.trim();
    void this.router.navigate(['/search'], {
      queryParams: query ? { q: query } : {}
    });
  }
}
