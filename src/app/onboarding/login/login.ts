import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { switchMap } from 'rxjs';
import { ContextoDisponivel, EmailNotVerifiedError, Onboarding } from '../../services/onboarding';
import { AuthService } from '../../shared/auth.service';
import { SnackbarService } from '../../shared/snackbar.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  form: FormGroup;
  isLoading = false;
  errorMessage = '';
  emailNotVerified = false;
  unverifiedEmail = '';
  isResending = false;
  resendSuccess = false;
  resendError = '';

  // Two-step flow state
  step: 'credentials' | 'select-context' = 'credentials';
  contextos: ContextoDisponivel[] = [];
  private pendingUsuarioId = '';

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private fb: FormBuilder,
    private onboarding: Onboarding,
    private auth: AuthService,
    private snackbar: SnackbarService,
    private router: Router,
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      senha: ['', [Validators.required]],
    });
  }

  get f() {
    return this.form.controls;
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.emailNotVerified = false;
    this.resendSuccess = false;
    this.resendError = '';

    const { email, senha } = this.form.value;

    this.onboarding
      .login(email, senha)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.isLoading = false;
          this.pendingUsuarioId = result.usuarioId;

          if (result.contextos.length === 1) {
            // Only one editora — auto-select it
            this.selectContext(result.contextos[0].editoraId);
          } else {
            // Multiple editoras — show the context-selection step
            this.contextos = result.contextos;
            this.step = 'select-context';
          }
        },
        error: (err) => {
          this.isLoading = false;
          if (err instanceof EmailNotVerifiedError) {
            this.emailNotVerified = true;
            this.unverifiedEmail = email;
          } else if (err instanceof HttpErrorResponse && err.status === 401) {
            this.errorMessage = 'E-mail ou senha incorretos.';
          } else {
            this.snackbar.show('Erro inesperado. Tente novamente.', 'error');
          }
        },
      });
  }

  selectContext(editoraId: string): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.onboarding
      .selectContext(this.pendingUsuarioId, editoraId)
      .pipe(
        switchMap(() => this.auth.checkSession()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (authenticated) => {
          this.isLoading = false;
          this.router.navigate([authenticated ? '/dashboard' : '/']);
        },
        error: (err) => {
          this.isLoading = false;
          if (err instanceof HttpErrorResponse && err.status === 401) {
            this.errorMessage = 'Sessão expirada. Faça login novamente.';
            this.step = 'credentials';
          } else {
            this.snackbar.show('Erro inesperado. Tente novamente.', 'error');
          }
        },
      });
  }

  resendVerification(): void {
    if (this.isResending) return;
    this.isResending = true;
    this.resendSuccess = false;
    this.resendError = '';

    this.onboarding
      .resendVerificationEmail(this.unverifiedEmail)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isResending = false;
          this.resendSuccess = true;
        },
        error: () => {
          this.isResending = false;
          this.resendError = 'Não foi possível reenviar. Tente novamente.';
        },
      });
  }
}
