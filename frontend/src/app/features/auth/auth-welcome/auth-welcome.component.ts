import { Component, DestroyRef, ElementRef, OnInit, ViewChild, inject } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { Router } from '@angular/router'
import { AnimationService } from '../../../core/services/animation.service'

@Component({
  selector: 'app-auth-welcome',
  standalone: true,
  templateUrl: './auth-welcome.component.html',
  styleUrl: './auth-welcome.component.scss'
})
export class AuthWelcomeComponent implements OnInit {
  private readonly router = inject(Router)
  private readonly animationService = inject(AnimationService)
  private readonly destroyRef = inject(DestroyRef)

  @ViewChild('welcomeRoot') welcomeRoot?: ElementRef<HTMLElement>

  ngOnInit(): void {
    requestAnimationFrame(() => {
      const root = this.welcomeRoot?.nativeElement
      if (!root) {
        return
      }

      const logo = root.querySelector('.auth-welcome__logo')
      const title = root.querySelector('.auth-welcome__title')
      const subtitle = root.querySelector('.auth-welcome__subtitle')

      if (logo) {
        this.animationService.enter(logo, 'scaleIn')
      }
      if (title) {
        this.animationService.enter(title, 'fadeUp', 0.12)
      }
      if (subtitle) {
        this.animationService.enter(subtitle, 'fadeUp', 0.22)
      }
    })

    const timer = setTimeout(() => {
      void this.router.navigate(['/feed'])
    }, 2200)

    this.destroyRef.onDestroy(() => clearTimeout(timer))
  }
}
