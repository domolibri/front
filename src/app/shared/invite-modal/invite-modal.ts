import {
  Component,
  ChangeDetectionStrategy,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { UserService, Role } from '../user.service';
import { SnackbarService } from '../snackbar.service';

@Component({
  selector: 'app-invite-modal',
  imports: [ReactiveFormsModule],
  templateUrl: './invite-modal.html',
  styleUrl: './invite-modal.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InviteModal {
  roles = input.required<Role[]>();

  closed = output<void>();
  invited = output<void>();

  private readonly userService = inject(UserService);
  private readonly snackbar = inject(SnackbarService);
  private readonly fb = inject(FormBuilder);

  protected isLoading = signal(false);
  protected errorMessage = signal<string | null>(null);

  protected form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    roleId: ['', Validators.required],
  });

  protected get f() {
    return this.form.controls;
  }

  protected onSubmit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.isLoading()) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const { email, roleId } = this.form.value;

    this.userService.inviteUser({ email: email!, roleId: roleId! }).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.snackbar.show(`Convite enviado para ${email}!`, 'success');
        this.invited.emit();
        this.close();
      },
      error: (err) => {
        this.isLoading.set(false);
        const detail = err?.error?.detail ?? 'Não foi possível enviar o convite. Tente novamente.';
        this.errorMessage.set(detail);
      },
    });
  }

  protected close(): void {
    this.closed.emit();
  }

  protected onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('invite-modal__backdrop')) {
      this.close();
    }
  }
}
