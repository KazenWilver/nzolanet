import { Component } from '@angular/core';

@Component({
  selector: 'app-publication-card-skeleton',
  standalone: true,
  template: `
    <article class="publication-skeleton" aria-hidden="true">
      <div class="publication-skeleton__grid">
        <div class="publication-skeleton__avatar"></div>
        <div class="publication-skeleton__content">
          <div class="publication-skeleton__line publication-skeleton__line--meta"></div>
          <div class="publication-skeleton__line publication-skeleton__line--text"></div>
          <div class="publication-skeleton__line publication-skeleton__line--text publication-skeleton__line--short"></div>
          <div class="publication-skeleton__media"></div>
          <div class="publication-skeleton__actions">
            <span class="publication-skeleton__pill"></span>
            <span class="publication-skeleton__pill"></span>
            <span class="publication-skeleton__pill"></span>
          </div>
        </div>
      </div>
    </article>
  `,
  styleUrl: './publication-card-skeleton.component.scss'
})
export class PublicationCardSkeletonComponent {}
