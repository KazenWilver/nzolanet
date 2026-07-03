import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AdminAuthService } from '../../../core/services/admin-auth.service';

@Component({
  selector: 'app-admin-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './admin-register.component.html',
  styleUrls: ['../admin-login/admin-login.component.scss', './admin-register.component.scss']
})
export class AdminRegisterComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly adminAuth = inject(AdminAuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly registerForm = this.formBuilder.nonNullable.group({
    displayName: ['', [Validators.required, Validators.minLength(2)]],
    username: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    adminCode: ['', [Validators.required]]
  });

  isLoading = false;
  showPassword = false;
  errorMessage = '';

  handleTogglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  handleSubmit(): void {
    this.registerForm.markAllAsTouched();
    this.errorMessage = '';

    if (this.registerForm.invalid) {
      return;
    }

    this.isLoading = true;
    const { displayName, username, email, password, adminCode } = this.registerForm.getRawValue();

    this.adminAuth
      .register({ displayName, username, email, password, adminCode })
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

  isInvalid(controlName: 'displayName' | 'username' | 'email' | 'password' | 'adminCode'): boolean {
    const control = this.registerForm.controls[controlName];
    return control.invalid && control.touched;
  }

  private resolveError(error: HttpErrorResponse): string {
    if (error.status === 403) {
      return error.error?.message ?? 'Código de administrador inválido.';
    }

    if (error.status === 409) {
      return error.error?.message ?? 'Já existe uma conta com este email ou nome de utilizador.';
    }

    if (error.status === 400) {
      return error.error?.message ?? 'Verifica os dados introduzidos.';
    }

    if (error.status === 0) {
      return 'Não foi possível contactar o servidor. Tenta novamente.';
    }

    return 'Ocorreu um erro ao criar a conta. Tenta novamente.';
  }
}
