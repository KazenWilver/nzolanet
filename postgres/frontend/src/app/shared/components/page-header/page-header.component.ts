import { Location } from '@angular/common';
import { Component, Input, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MobileAccountButtonComponent } from '../mobile-account-button/mobile-account-button.component';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [RouterModule, MobileAccountButtonComponent],
  templateUrl: './page-header.component.html',
  styleUrl: './page-header.component.scss'
})
export class PageHeaderComponent {
  private readonly location = inject(Location);

  @Input({ required: true }) title = '';
  @Input() subtitle?: string;
  @Input() showBack = true;
  @Input() backLink?: string | string[];
  @Input() showAccountMenu = false;
  handleBack(): void {
    if (this.backLink) {
      return;
    }

    this.location.back();
  }
}
