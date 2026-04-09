import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Onboarding } from '../../services/onboarding';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForgotPassword {
  form: FormGroup;
  isLoading = false;
  submitted = false;

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private fb: FormBuilder,
    private onboarding: Onboarding,
    private cdr: ChangeDetectorRef,
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
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

    this.onboarding
      .forgotPassword(this.form.value.email)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.submitted = true;
          this.cdr.markForCheck();
        },
        error: () => {
          // Always show success to avoid e-mail enumeration
          this.isLoading = false;
          this.submitted = true;
          this.cdr.markForCheck();
        },
      });
  }
}
