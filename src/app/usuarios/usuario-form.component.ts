import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { UsuarioService } from './usuario.service';
import { SnackbarService } from '../shared/snackbar.service';

@Component({
  selector: 'app-usuario-form',
  imports: [ReactiveFormsModule],
  templateUrl: './usuario-form.component.html',
  styleUrl: './usuario-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsuarioFormComponent {
  closed = output<void>();
  saved = output<void>();

  private readonly fb = inject(FormBuilder);
  private readonly usuarioService = inject(UsuarioService);
  private readonly snackbar = inject(SnackbarService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly isSubmitting = signal(false);
  protected readonly errorMessage = signal('');

  protected readonly usuarioForm = this.fb.group({
    nome: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    tipoVinculo: ['Interno', Validators.required],
  });

  protected readonly tiposVinculo = ['Interno', 'Parceiro', 'Freelancer', 'Autor'];

  protected get f() {
    return this.usuarioForm.controls;
  }

  protected submit(): void {
    this.usuarioForm.markAllAsTouched();
    if (this.usuarioForm.invalid || this.isSubmitting()) return;

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    this.usuarioService
      .cadastrarUsuario({
        nome: this.f['nome'].value!,
        email: this.f['email'].value!,
        tipoVinculo: this.f['tipoVinculo'].value!,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.snackbar.show('Usuário vinculado com sucesso.', 'success');
          this.saved.emit();
          this.close();
        },
        error: (err: HttpErrorResponse) => {
          this.isSubmitting.set(false);
          this.errorMessage.set(
            err.error?.detail ?? 'Não foi possível cadastrar o usuário. Tente novamente.',
          );
          if (err.status >= 500) {
            this.snackbar.show('Erro inesperado. Tente novamente.', 'error');
          }
        },
      });
  }

  protected close(): void {
    this.closed.emit();
  }

  protected onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('usuario-form__backdrop')) {
      this.close();
    }
  }
}
