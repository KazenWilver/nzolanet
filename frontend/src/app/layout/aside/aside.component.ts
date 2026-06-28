import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PlaceholderFeatureComponent } from '../../shared/components/placeholder-feature/placeholder-feature.component';

@Component({
  selector: 'app-aside',
  standalone: true,
  imports: [FormsModule, PlaceholderFeatureComponent],
  templateUrl: './aside.component.html',
  styleUrl: './aside.component.scss'
})
export class AsideComponent {
  private readonly router = inject(Router);

  searchQuery = '';

  handleSearchSubmit(): void {
    const query = this.searchQuery.trim();
    if (!query) {
      void this.router.navigate(['/search']);
      return;
    }

    void this.router.navigate(['/search'], { queryParams: { q: query } });
  }
}
