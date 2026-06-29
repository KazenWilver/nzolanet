import { Location } from '@angular/common';
import { Component, Input, inject } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './page-header.component.html',
  styleUrl: './page-header.component.scss'
})
export class PageHeaderComponent {
  private readonly location = inject(Location);

  @Input({ required: true }) title = '';
  @Input() subtitle?: string;
  @Input() showBack = true;
  @Input() backLink?: string | string[];

  handleBack(): void {
    if (this.backLink) {
      return;
    }

    this.location.back();
  }
}
