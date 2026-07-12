import { Component, OnInit, inject } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { UserService } from '../../core/services/user.service'

@Component({
  selector: 'app-profile-by-username-redirect',
  standalone: true,
  template: ''
})
export class ProfileByUsernameRedirectComponent implements OnInit {
  private readonly route = inject(ActivatedRoute)
  private readonly router = inject(Router)
  private readonly userService = inject(UserService)

  ngOnInit(): void {
    const username = this.route.snapshot.paramMap.get('username')
    if (!username) {
      void this.router.navigate(['/search'])
      return
    }

    this.userService.getProfileByUsername(username).subscribe({
      next: user => {
        void this.router.navigate(['/profile', user.id], { replaceUrl: true })
      },
      error: () => {
        void this.router.navigate(['/search'], {
          queryParams: { q: `@${username}` },
          replaceUrl: true
        })
      }
    })
  }
}
