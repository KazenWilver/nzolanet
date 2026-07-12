import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AdminAuthService } from '../../../core/services/admin-auth.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './admin-login.component.html',
  styleUrl: './admin-login.component.scss'
})
export class AdminLoginComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly adminAuth = inject(AdminAuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly loginForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  isLoading = false;
  showPassword = false;
  errorMessage = '';

  handleTogglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  handleSubmit(): void {
    this.loginForm.markAllAsTouched();
    this.errorMessage = '';

    if (this.loginForm.invalid) {
      return;
    }

    this.isLoading = true;
    const { email, password } = this.loginForm.getRawValue();

    this.adminAuth
      .login({ email, password })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isLoading = false;
          void this.router.navigate(['/admin']);
        },
        error: (error: HttpErrorResponse) => {
          this.isLoading = false;
          this.errorMessage = this.resolveError(error);
        }
      });
  }

  isInvalid(controlName: 'email' | 'password'): boolean {
    const control = this.loginForm.controls[controlName];
    return control.invalid && control.touched;
  }

  private resolveError(error: HttpErrorResponse): string {
    if (error.status === 401) {
      return error.error?.message ?? 'Credenciais inválidas ou sem privilégios de administrador.';
    }

    if (error.status === 0) {
      return 'Não foi possível contactar o servidor. Tenta novamente.';
    }

    return 'Ocorreu um erro ao iniciar sessão. Tenta novamente.';
  }
}
