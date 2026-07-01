import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { HttpErrorResponse } from '@angular/common/http';
import { TPipe } from '../../../core/i18n/translate.pipe';
import { LocaleService } from '../../../core/i18n/locale.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, LoadingSpinnerComponent, TPipe],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly localeService = inject(LocaleService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  readonly loginForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  readonly forgotForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]]
  });

  isLoading = false;
  isForgotLoading = false;
  showPassword = false;
  showForgotPassword = false;
  errorMessage = '';
  forgotSuccessMessage = '';
  devResetLink = '';
  sessionExpiredMessage = '';

  ngOnInit(): void {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      this.sessionExpiredMessage = params.get('sessionExpired') === '1'
        ? this.localeService.translate('auth.sessionExpired')
        : '';
    });
  }

  handleSubmit(): void {
    this.loginForm.markAllAsTouched();
    this.errorMessage = '';

    if (this.loginForm.invalid) {
      return;
    }

    const { email, password } = this.loginForm.getRawValue();
    this.isLoading = true;

    this.authService
      .login({ email, password })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isLoading = false;
          void this.router.navigate(['/feed']);
        },
        error: (error: HttpErrorResponse) => {
          this.isLoading = false;
          this.errorMessage =
            error.status === 401
              ? this.localeService.translate('auth.invalidCredentials')
              : this.localeService.translate('auth.loginFailed');
        }
      });
  }

  handleForgotPassword(): void {
    this.forgotForm.markAllAsTouched();
    this.forgotSuccessMessage = '';
    this.devResetLink = '';

    if (this.forgotForm.invalid) {
      return;
    }

    this.isForgotLoading = true;
    const { email } = this.forgotForm.getRawValue();

    this.authService
      .forgotPassword(email)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: response => {
          this.isForgotLoading = false;
          this.forgotSuccessMessage =
            this.localeService.translate('auth.recoverSent');
          if (!environment.production && response.devResetLink) {
            this.devResetLink = response.devResetLink;
          }
        },
        error: () => {
          this.isForgotLoading = false;
          this.forgotSuccessMessage =
            this.localeService.translate('auth.recoverSent');
        }
      });
  }

  handleShowForgotPassword(): void {
    this.showForgotPassword = true;
    this.errorMessage = '';
    this.forgotSuccessMessage = '';
    this.devResetLink = '';
    const email = this.loginForm.controls.email.value;
    if (email) {
      this.forgotForm.controls.email.setValue(email);
    }
  }

  handleBackToLogin(): void {
    this.showForgotPassword = false;
    this.forgotSuccessMessage = '';
    this.devResetLink = '';
    this.forgotForm.reset();
  }

  isInvalid(controlName: 'email' | 'password'): boolean {
    const control = this.loginForm.controls[controlName];
    return control.invalid && control.touched;
  }

  isForgotInvalid(): boolean {
    const control = this.forgotForm.controls.email;
    return control.invalid && control.touched;
  }

  getEmailError(): string {
    const control = this.loginForm.controls.email;
    if (!control.touched || !control.errors) {
      return '';
    }
    if (control.errors['required']) {
      return this.localeService.translate('auth.emailRequired');
    }
    if (control.errors['email']) {
      return this.localeService.translate('auth.emailInvalid');
    }
    return '';
  }

  getPasswordError(): string {
    const control = this.loginForm.controls.password;
    if (!control.touched || !control.errors) {
      return '';
    }
    if (control.errors['required']) {
      return this.localeService.translate('auth.passwordRequired');
    }
    if (control.errors['minlength']) {
      return this.localeService.translate('auth.passwordMin');
    }
    return '';
  }
}
