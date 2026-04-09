import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Onboarding } from '../../services/onboarding';

function senhasIguaisValidator(control: AbstractControl): ValidationErrors | null {
  const nova = control.get('novaSenha')?.value;
  const confirmar = control.get('confirmarSenha')?.value;
  return nova && confirmar && nova !== confirmar ? { senhasDiferentes: true } : null;
}

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResetPassword implements OnInit {
  form: FormGroup;
  isLoading = false;
  success = false;
  errorMessage = '';

  private email = '';
  private token = '';
  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private onboarding: Onboarding,
    private cdr: ChangeDetectorRef,
  ) {
    this.form = this.fb.group(
      {
        novaSenha: [
          '',
          [
            Validators.required,
            Validators.minLength(8),
            Validators.pattern(
              /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
            ),
          ],
        ],
        confirmarSenha: ['', [Validators.required]],
      },
      { validators: senhasIguaisValidator },
    );
  }

  get f() {
    return this.form.controls;
  }

  ngOnInit(): void {
    this.email = this.route.snapshot.queryParamMap.get('email') ?? '';
    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';

    if (!this.email || !this.token) {
      this.router.navigate(['/esqueci-senha']);
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.onboarding
      .resetPassword(this.email, this.token, this.form.value.novaSenha)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.success = true;
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage =
            err?.error?.detail ?? 'Link inválido ou expirado. Solicite um novo link.';
          this.cdr.markForCheck();
        },
      });
  }
}
