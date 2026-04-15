import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { RouterLink } from '@angular/router';
import { AsyncPipe, NgTemplateOutlet } from '@angular/common';
import { AuthService } from '../../shared/auth.service';
import { UserService, Role } from '../../shared/user.service';
import { InviteModal } from '../../shared/invite-modal/invite-modal';

interface DashboardCard {
  title: string;
  description: string;
  icon: string;
  route: string | null;
  badge: string | null;
  badgeConfigured?: boolean;
}

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, AsyncPipe, NgTemplateOutlet, InviteModal],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard {
  protected readonly auth = inject(AuthService);
  private readonly userService = inject(UserService);

  protected readonly showInviteModal = signal(false);
  protected readonly roles = toSignal(
    this.userService.getRoles().pipe(catchError(() => of([] as Role[]))),
    { initialValue: [] as Role[] },
  );

  protected openInviteModal(): void {
    this.showInviteModal.set(true);
  }

  protected closeInviteModal(): void {
    this.showInviteModal.set(false);
  }

  protected get cards(): DashboardCard[] {
    const brandingConfigurado = this.auth.currentUser?.brandingConfigurado ?? false;
    return [
      {
        title: 'Identidade Visual',
        description: 'Configure logotipo e cor primária da sua editora.',
        icon: 'branding',
        route: '/branding',
        badge: brandingConfigurado ? 'Configurado' : null,
        badgeConfigured: brandingConfigurado,
      },
      {
        title: 'Usuários',
        description: 'Gerencie administradores e editores da sua equipe.',
        icon: 'users',
        route: '/usuarios',
        badge: null,
      },
      {
        title: 'Livros',
        description: 'Acompanhe o catálogo e o workflow editorial.',
        icon: 'books',
        route: null,
        badge: 'Em breve',
      },
      {
        title: 'Pagamentos',
        description: 'Extratos e repasses para colaboradores.',
        icon: 'payments',
        route: null,
        badge: 'Em breve',
      },
    ];
  }
}

