import { Component } from '@angular/core'
import { CommonModule } from '@angular/common'
import { TPipe } from '../../core/i18n/translate.pipe'

@Component({
  selector: 'app-about-page',
  standalone: true,
  imports: [CommonModule, TPipe],
  templateUrl: './about-page.component.html',
  styleUrl: './about-page.component.scss'
})
export class AboutPageComponent {}
