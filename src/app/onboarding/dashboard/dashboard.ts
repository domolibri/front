import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AsyncPipe, NgTemplateOutlet, UpperCasePipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
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
  imports: [RouterLink, AsyncPipe, NgTemplateOutlet, UpperCasePipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  private readonly currentUser = toSignal(this.auth.currentUser$, { initialValue: null });

  protected logout(): void {
    this.auth.logout();
    this.router.navigate(['/']);
  }

  protected readonly cards = computed((): DashboardCard[] => {
    const brandingConfigurado = this.currentUser()?.brandingConfigurado ?? false;
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
  });
}

