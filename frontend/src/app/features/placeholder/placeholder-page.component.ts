import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PlaceholderFeatureComponent } from '../../shared/components/placeholder-feature/placeholder-feature.component';

@Component({
  selector: 'app-placeholder-page',
  standalone: true,
  imports: [PlaceholderFeatureComponent],
  template: `
    <section class="placeholder-page">
      <app-placeholder-feature [featureName]="featureName" />
    </section>
  `,
  styles: `
    .placeholder-page {
      min-height: 50vh;
      display: flex;
      align-items: center;
      justify-content: center;
      border-bottom: var(--border-width) solid var(--color-border);
    }
  `
})
export class PlaceholderPageComponent {
  private readonly route = inject(ActivatedRoute);
  readonly featureName = this.route.snapshot.data['featureName'] as string;
}
