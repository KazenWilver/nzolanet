import { Component } from '@angular/core';
import { PrivateLayoutComponent } from '../../layouts/private-layout/private-layout.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [PrivateLayoutComponent],
  template: '<app-private-layout />'
})
export class MainLayoutComponent {}
