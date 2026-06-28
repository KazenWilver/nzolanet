import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, LoadingSpinnerComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
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
        next: () => void this.router.navigate(['/feed']),
        error: (error: HttpErrorResponse) => {
          this.isLoading = false;
          this.errorMessage =
            error.status === 401
              ? 'Credenciais inválidas.'
              : 'Não foi possível entrar. Tenta novamente.';
        }
      });
  }

  handleForgotPassword(): void {
    this.forgotForm.markAllAsTouched();
    this.forgotSuccessMessage = '';

    if (this.forgotForm.invalid) {
      return;
    }

    this.isForgotLoading = true;
    const { email } = this.forgotForm.getRawValue();

    this.authService
      .forgotPassword(email)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isForgotLoading = false;
          this.forgotSuccessMessage =
            'Se o email existir, receberás instruções para recuperar a palavra-passe.';
        },
        error: () => {
          this.isForgotLoading = false;
          this.forgotSuccessMessage =
            'Se o email existir, receberás instruções para recuperar a palavra-passe.';
        }
      });
  }

  handleShowForgotPassword(): void {
    this.showForgotPassword = true;
    this.errorMessage = '';
    this.forgotSuccessMessage = '';
    const email = this.loginForm.controls.email.value;
    if (email) {
      this.forgotForm.controls.email.setValue(email);
    }
  }

  handleBackToLogin(): void {
    this.showForgotPassword = false;
    this.forgotSuccessMessage = '';
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
      return 'O email é obrigatório.';
    }
    if (control.errors['email']) {
      return 'Introduz um email válido.';
    }
    return '';
  }

  getPasswordError(): string {
    const control = this.loginForm.controls.password;
    if (!control.touched || !control.errors) {
      return '';
    }
    if (control.errors['required']) {
      return 'A palavra-passe é obrigatória.';
    }
    if (control.errors['minlength']) {
      return 'Mínimo de 6 caracteres.';
    }
    return '';
  }
}
