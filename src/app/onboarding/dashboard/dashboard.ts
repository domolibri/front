import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AsyncPipe, NgTemplateOutlet } from '@angular/common';
import { AuthService } from '../../shared/auth.service';

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
  imports: [RouterLink, AsyncPipe, NgTemplateOutlet],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard {
  protected readonly auth = inject(AuthService);

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

