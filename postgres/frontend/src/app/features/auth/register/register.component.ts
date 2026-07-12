import { Component, DestroyRef, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { AnimationService } from '../../../core/services/animation.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { HttpErrorResponse } from '@angular/common/http';

const usernamePattern = /^[^\s]+$/;

const passwordsMatchValidator = (control: AbstractControl): ValidationErrors | null => {
  const password = control.parent?.get('password')?.value;
  const confirmPassword = control.value;

  if (!confirmPassword || !password) {
    return null;
  }

  return password === confirmPassword ? null : { mismatch: true };
};

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, LoadingSpinnerComponent],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly animationService = inject(AnimationService);

  @ViewChild('formRoot') formRoot?: ElementRef<HTMLElement>;

  readonly registerForm = this.formBuilder.nonNullable.group({
    username: ['', [Validators.required, Validators.minLength(3), Validators.pattern(usernamePattern)]],
    email: ['', [Validators.required, Validators.email]],
    displayName: [''],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required, passwordsMatchValidator]]
  });

  isLoading = false;
  showPassword = false;
  errorMessage = '';
  emailApiError = '';

  constructor() {
    this.registerForm.controls.password.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.registerForm.controls.confirmPassword.updateValueAndValidity());
  }

  ngOnInit(): void {
    requestAnimationFrame(() => this.animateEntrance());
  }

  handleTogglePassword(): void {
    this.showPassword = !this.showPassword;
    const toggle = this.formRoot?.nativeElement.querySelector('.auth-form__toggle');
    if (toggle && this.animationService.isEnabled) {
      this.animationService.pressFeedback(toggle);
    }
  }

  private animateEntrance(): void {
    const root = this.formRoot?.nativeElement;
    if (!root) {
      return;
    }

    const items = root.querySelectorAll('.auth-form__header, .auth-form__field, .auth-form__submit, .auth-form__footer');
    if (items.length > 0) {
      this.animationService.staggerEnter(Array.from(items), 'fadeUp', 0.05);
    }
  }

  handleSubmit(): void {
    this.registerForm.markAllAsTouched();
    this.errorMessage = '';
    this.emailApiError = '';

    if (this.registerForm.invalid) {
      return;
    }

    const { username, email, displayName, password } = this.registerForm.getRawValue();
    this.isLoading = true;

    this.authService
      .register({
        username,
        email,
        password,
        displayName: displayName.trim() || undefined
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => void this.router.navigate(['/welcome']),
        error: (error: HttpErrorResponse) => {
          this.isLoading = false;

          if (error.status === 0) {
            this.errorMessage = 'Sem ligação ao servidor. Verifica a internet e tenta novamente.';
            return;
          }

          const message = this.extractErrorMessage(error);

          if (error.status === 409 || this.isDuplicateEmailMessage(message)) {
            this.emailApiError = 'Este email já está registado.';
            return;
          }

          this.errorMessage = message || 'Não foi possível criar a conta. Tenta novamente.';
        }
      });
  }

  isInvalid(controlName: 'username' | 'email' | 'password' | 'confirmPassword'): boolean {
    const control = this.registerForm.controls[controlName];
    return control.invalid && control.touched;
  }

  getUsernameError(): string {
    const control = this.registerForm.controls.username;
    if (!control.touched || !control.errors) {
      return '';
    }
    if (control.errors['required']) {
      return 'O username é obrigatório.';
    }
    if (control.errors['minlength']) {
      return 'Mínimo de 3 caracteres.';
    }
    if (control.errors['pattern']) {
      return 'O username não pode conter espaços.';
    }
    return '';
  }

  getEmailError(): string {
    if (this.emailApiError) {
      return this.emailApiError;
    }

    const control = this.registerForm.controls.email;
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
    const control = this.registerForm.controls.password;
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

  getConfirmPasswordError(): string {
    const control = this.registerForm.controls.confirmPassword;
    if (!control.touched || !control.errors) {
      return '';
    }
    if (control.errors['required']) {
      return 'Confirma a palavra-passe.';
    }
    if (control.errors['mismatch']) {
      return 'As palavras-passe não coincidem.';
    }
    return '';
  }

  private extractErrorMessage(error: HttpErrorResponse): string {
    const payload = error.error;

    if (typeof payload === 'string') {
      return payload;
    }

    if (payload?.message) {
      return payload.message;
    }

    if (payload?.title) {
      return payload.title;
    }

    if (payload?.errors) {
      const firstKey = Object.keys(payload.errors)[0];
      const firstError = payload.errors[firstKey];
      if (Array.isArray(firstError) && firstError.length > 0) {
        return firstError[0];
      }
    }

    return '';
  }

  private isDuplicateEmailMessage(message: string): boolean {
    const normalized = message.toLowerCase();
    return normalized.includes('email') && (normalized.includes('exist') || normalized.includes('utilizad'));
  }
}
