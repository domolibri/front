import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { UsuarioService, VinculoUsuarioResponseDto } from './usuario.service';
import { InviteModal } from '../shared/invite-modal/invite-modal';
import { UserService, Role } from '../shared/user.service';
import { catchError, of } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-usuario-list',
  imports: [DatePipe, InviteModal],
  templateUrl: './usuario-list.component.html',
  styleUrl: './usuario-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsuarioListComponent implements OnInit {
  private readonly usuarioService = inject(UsuarioService);
  private readonly userService = inject(UserService);

  protected readonly usuarios = signal<VinculoUsuarioResponseDto[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal('');
  protected readonly showInviteModal = signal(false);

  protected readonly roles = toSignal(
    this.userService.getRoles().pipe(catchError(() => of([] as Role[]))),
    { initialValue: [] as Role[] },
  );

  ngOnInit(): void {
    this.loadUsuarios();
  }

  protected openInviteModal(): void {
    this.showInviteModal.set(true);
  }

  protected closeInviteModal(): void {
    this.showInviteModal.set(false);
  }

  protected onUserInvited(): void {
    this.loadUsuarios();
    this.closeInviteModal();
  }

  protected retry(): void {
    this.loadUsuarios();
  }

  private loadUsuarios(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.usuarioService.getUsuarios().subscribe({
      next: (usuarios) => {
        this.usuarios.set(usuarios);
        this.isLoading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.errorMessage.set(
          err.error?.detail ?? 'Não foi possível carregar os usuários desta editora.',
        );
        this.isLoading.set(false);
      },
    });
  }
}
