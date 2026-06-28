import { Component } from '@angular/core';
import { PlaceholderFeatureComponent } from '../../shared/components/placeholder-feature/placeholder-feature.component';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [PlaceholderFeatureComponent],
  template: `
    <div class="settings-page">
      <h1 class="settings-page__title">Definições</h1>
      <app-placeholder-feature featureName="Definições" />
    </div>
  `,
  styles: `
    .settings-page {
      padding: var(--spacing-xl);
      border-bottom: var(--border-width) solid var(--color-border);
    }

    .settings-page__title {
      margin: 0 0 var(--spacing-lg);
      font-size: var(--font-size-xl);
      font-weight: var(--font-weight-bold);
    }
  `
})
export class SettingsComponent {}
