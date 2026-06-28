import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-placeholder-feature',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="placeholder-feature" role="status" aria-live="polite">
      <div class="placeholder-feature__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="9"></circle>
          <path d="M12 7v5l3 2"></path>
        </svg>
      </div>
      @if (featureName) {
        <h2 class="placeholder-feature__title">{{ featureName }}</h2>
      }
      <p class="placeholder-feature__message">Esta funcionalidade será implementada em breve.</p>
    </section>
  `,
  styles: `
    .placeholder-feature {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: var(--spacing-md);
      padding: var(--spacing-3xl) var(--spacing-xl);
      text-align: center;
      color: var(--color-text-secondary);
    }

    .placeholder-feature__icon {
      color: var(--color-text-muted);
    }

    .placeholder-feature__title {
      margin: 0;
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-bold);
      color: var(--color-text-primary);
    }

    .placeholder-feature__message {
      margin: 0;
      font-size: var(--font-size-base);
      max-width: 20rem;
    }
  `
})
export class PlaceholderFeatureComponent {
  @Input() featureName = '';
}
