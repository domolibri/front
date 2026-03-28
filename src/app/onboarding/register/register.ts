import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
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

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.onboarding.registerEditora(this.form.value).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.auth.saveToken(res.token);
        this.snackbar.show('Editora cadastrada com sucesso! Bem-vindo(a)!');
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage =
          err.error?.message ?? 'Erro ao cadastrar. Tente novamente.';
      },
    });
  }
}
