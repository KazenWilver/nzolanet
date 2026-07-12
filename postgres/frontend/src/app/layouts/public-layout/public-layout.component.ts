import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild, inject } from '@angular/core'
import { RouterModule } from '@angular/router'
import { AnimationService } from '../../core/services/animation.service'
import { ThemeService } from '../../core/services/theme.service'

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './public-layout.component.html',
  styleUrl: './public-layout.component.scss'
})
export class PublicLayoutComponent implements OnInit, OnDestroy, AfterViewInit {
  private readonly themeService = inject(ThemeService)
  private readonly animationService = inject(AnimationService)

  @ViewChild('formPanel') formPanel?: ElementRef<HTMLElement>

  ngOnInit(): void {
    this.themeService.setDarkMode(false)
    document.body.classList.add('public-auth-page')
  }

  ngAfterViewInit(): void {
    requestAnimationFrame(() => {
      const panel = this.formPanel?.nativeElement
      if (!panel) {
        return
      }

      const brand = panel.querySelector('.layout-publico__brand')
      const cartao = panel.querySelector('.layout-publico__cartao')

      if (brand) {
        this.animationService.enter(brand, 'fadeIn', 0)
      }
      if (cartao) {
        this.animationService.enter(cartao, 'fadeUp', 0.08)
      }
    })
  }

  ngOnDestroy(): void {
    document.body.classList.remove('public-auth-page')
    const saved = localStorage.getItem('nzolanet_theme')
    this.themeService.setDarkMode(saved === 'dark')
  }
}
