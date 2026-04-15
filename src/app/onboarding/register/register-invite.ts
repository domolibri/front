import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { UserService, InviteDetails, AcceptInvitePayload } from '../../shared/user.service';
import { SnackbarService } from '../../shared/snackbar.service';

@Component({
  selector: 'app-register-invite',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register-invite.html',
  styleUrl: './register.scss', // Reuse styles from register
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterInvite implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly userService = inject(UserService);
  private readonly snackbar = inject(SnackbarService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);

  protected readonly inviteDetails = signal<InviteDetails | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly isSubmitting = signal(false);
  protected readonly errorMessage = signal('');
  protected token = '';

  protected readonly form = this.fb.group({
    nome: [''],
    senha: [''],
    aceitouTermos: [false, [Validators.requiredTrue]],
  });

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';
    if (!this.token) {
      this.errorMessage.set('Token de convite ausente.');
      this.isLoading.set(false);
      return;
    }

    this.userService.getInviteDetails(this.token)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (details) => {
          this.inviteDetails.set(details);
          
          // Set validators based on whether user already exists
          if (!details.usuarioExiste) {
            this.form.get('nome')?.setValidators([
              Validators.required,
              Validators.minLength(2),
            ]);
            this.form.get('senha')?.setValidators([
              Validators.required,
              Validators.minLength(8),
              Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/),
            ]);
          }
          this.form.get('nome')?.updateValueAndValidity();
          this.form.get('senha')?.updateValueAndValidity();
          
          this.isLoading.set(false);
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.errorMessage.set(err?.error?.detail ?? 'Convite inválido ou expirado.');
          this.isLoading.set(false);
          this.cdr.markForCheck();
        },
      });
  }

  protected onSubmit(): void {
    if (this.form.invalid || this.isSubmitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    const payload: AcceptInvitePayload = {
      token: this.token,
    };
    
    if (!this.inviteDetails()?.usuarioExiste) {
      payload.nome = this.form.value.nome!;
      payload.senha = this.form.value.senha!;
    }

    this.userService.acceptInvite(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.snackbar.show('Convite aceito com sucesso! Agora você pode fazer login.', 'success');
          this.router.navigate(['/login']);
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.errorMessage.set(err?.error?.detail ?? 'Não foi possível aceitar o convite.');
          this.cdr.markForCheck();
        },
      });
  }
}
