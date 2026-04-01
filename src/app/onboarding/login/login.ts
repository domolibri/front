import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { EmailNotVerifiedError, Onboarding } from '../../services/onboarding';
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

    this.onboarding.login(email, senha).subscribe({
      next: () => {
        // Busca os dados da sessão após login para popular currentUser$
        // antes de navegar — garante que topbar e módulos apareçam juntos.
        this.auth.checkSession().subscribe((authenticated) => {
          this.isLoading = false;
          this.router.navigate([authenticated ? '/dashboard' : '/']);
        });
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

  resendVerification(): void {
    if (this.isResending) return;
    this.isResending = true;
    this.resendSuccess = false;
    this.resendError = '';

    this.onboarding.resendVerificationEmail(this.unverifiedEmail).subscribe({
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
