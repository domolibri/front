import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
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
export class Dashboard implements OnInit {
  protected readonly auth = inject(AuthService);
  private readonly userService = inject(UserService);

  protected showInviteModal = signal(false);
  protected roles = signal<Role[]>([]);

  ngOnInit(): void {
    this.userService.getRoles().subscribe({
      next: (roles) => this.roles.set(roles),
      error: () => { /* roles stay empty; modal will show an empty select */ },
    });
  }

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
        route: null,
        badge: 'Em breve',
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

