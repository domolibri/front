import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  output,
  signal,
  effect,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { UsuarioService, VinculoUsuarioResponseDto } from './usuario.service';
import { UserService, Role } from '../shared/user.service';
import { SnackbarService } from '../shared/snackbar.service';

@Component({
  selector: 'app-usuario-form',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './usuario-form.component.html',
  styleUrl: './usuario-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsuarioFormComponent {
  closed = output<void>();
  saved = output<void>();

  vinculoData = input<VinculoUsuarioResponseDto | null>(null);

  private readonly fb = inject(FormBuilder);
  private readonly usuarioService = inject(UsuarioService);
  private readonly userService = inject(UserService);
  private readonly snackbar = inject(SnackbarService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly isSubmitting = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly roles = signal<Role[]>([]);
  protected readonly selectedRoles = signal<Set<string>>(new Set());

  protected readonly usuarioForm = this.fb.group({
    nome: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    tipoVinculo: ['Interno', Validators.required],
    roleIds: [[] as string[]],
  });

  protected readonly tiposVinculo = ['Interno', 'Parceiro', 'Freelancer', 'Autor'];

  constructor() {
    effect(() => {
      if (this.vinculoData()) {
        this.isEditMode = true;
      }
    });

    this.carregarRoles();
  }

  protected isEditMode = false;

  protected get f() {
    return this.usuarioForm.controls;
  }

  protected toggleRole(roleId: string): void {
    const roles = new Set(this.selectedRoles());
    if (roles.has(roleId)) {
      roles.delete(roleId);
    } else {
      roles.add(roleId);
    }
    this.selectedRoles.set(roles);
    this.usuarioForm.patchValue({
      roleIds: Array.from(roles),
    });
  }

  protected isRoleSelected(roleId: string): boolean {
    return this.selectedRoles().has(roleId);
  }

  private carregarRoles(): void {
    this.userService
      .getRoles()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (roles) => {
          this.roles.set(roles);
        },
        error: () => {
          this.snackbar.show('Não foi possível carregar as roles.', 'error');
        },
      });
  }

  protected submit(): void {
    this.usuarioForm.markAllAsTouched();
    if (this.usuarioForm.invalid || this.isSubmitting()) return;

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    if (this.isEditMode && this.vinculoData()?.id) {
      this.atualizarRoles();
    } else {
      this.criarUsuario();
    }
  }

  private criarUsuario(): void {
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

  private atualizarRoles(): void {
    const vinculoId = this.vinculoData()?.id;
    const roleIds = this.f['roleIds'].value || [];

    if (!vinculoId) {
      this.isSubmitting.set(false);
      return;
    }

    this.usuarioService
      .atualizarRoles(vinculoId, roleIds)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.snackbar.show('Roles atualizadas com sucesso.', 'success');
          this.saved.emit();
          this.close();
        },
        error: (err: HttpErrorResponse) => {
          this.isSubmitting.set(false);
          this.errorMessage.set(
            err.error?.detail ?? 'Não foi possível atualizar as roles. Tente novamente.',
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
