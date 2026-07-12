import { Component, OnInit, inject } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { ActivatedRoute, RouterModule } from '@angular/router'
import { AuthService } from '../../../core/services/auth.service'
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component'

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LoadingSpinnerComponent],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss'
})
export class ResetPasswordComponent implements OnInit {
  private readonly authService = inject(AuthService)
  private readonly route = inject(ActivatedRoute)

  email = ''
  token = ''
  newPassword = ''
  confirmPassword = ''
  submitting = false
  success = false
  error = ''
  invalidLink = false

  ngOnInit(): void {
    this.email = this.route.snapshot.queryParamMap.get('email') ?? ''
    this.token = this.route.snapshot.queryParamMap.get('token') ?? ''

    if (!this.email || !this.token) {
      this.invalidLink = true
    }
  }

  handleSubmit(): void {
    if (this.invalidLink || this.submitting) {
      return
    }

    if (this.newPassword !== this.confirmPassword) {
      this.error = 'As palavras-passe não coincidem.'
      return
    }

    this.submitting = true
    this.error = ''

    this.authService
      .resetPassword({
        email: this.email,
        token: this.token,
        newPassword: this.newPassword,
        confirmNewPassword: this.confirmPassword
      })
      .subscribe({
        next: () => {
          this.success = true
          this.submitting = false
        },
        error: (err: { error?: { message?: string } }) => {
          this.error = err.error?.message ?? 'Não foi possível redefinir a palavra-passe.'
          this.submitting = false
        }
      })
  }
}
