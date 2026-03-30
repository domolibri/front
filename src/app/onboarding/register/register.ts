import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Onboarding } from '../../services/onboarding';
import { AuthService } from '../../shared/auth.service';
import { SnackbarService } from '../../shared/snackbar.service';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register {
  form: FormGroup;
  isLoading = false;
  errorMessage = '';
  fieldErrors: Record<string, string> = {};

  constructor(
    private fb: FormBuilder,
    private onboarding: Onboarding,
    private auth: AuthService,
    private snackbar: SnackbarService,
    private router: Router,
  ) {
    this.form = this.fb.group({
      nomeEditora: ['', [Validators.required, Validators.minLength(2)]],
      nomeAdmin: ['', [Validators.required, Validators.minLength(2)]],
      emailAdmin: ['', [Validators.required, Validators.email]],
      senha: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  get f() {
    return this.form.controls;
  }

  clearFieldError(field: string): void {
    delete this.fieldErrors[field];
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.fieldErrors = {};

    this.onboarding.registerEditora(this.form.value).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.auth.saveToken(res.token);
        this.router.navigate(['/cadastro/sucesso'], {
          queryParams: { email: this.form.value.emailAdmin },
        });
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading = false;
        if (err.status === 400) {
          const apiErrors: Record<string, string[]> = err.error?.errors ?? {};
          for (const [field, messages] of Object.entries(apiErrors)) {
            const key = field.charAt(0).toLowerCase() + field.slice(1);
            this.fieldErrors[key] = Array.isArray(messages) ? messages[0] : messages;
          }
        } else if (err.status === 409 || err.status === 422) {
          this.errorMessage = err.error?.detail ?? err.error?.title ?? 'Operação não permitida.';
        } else {
          this.snackbar.show('Erro inesperado. Tente novamente.', 'error');
        }
      },
    });
  }
}
