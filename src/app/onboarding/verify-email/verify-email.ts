import { Component, DestroyRef, OnDestroy, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { switchMap, tap } from 'rxjs';
import { Onboarding } from '../../services/onboarding';
import { AuthService } from '../../shared/auth.service';

type VerifyStatus = 'verifying' | 'success';

@Component({
  selector: 'app-verify-email',
  imports: [RouterLink],
  templateUrl: './verify-email.html',
  styleUrl: './verify-email.scss',
})
export class VerifyEmail implements OnInit, OnDestroy {
  status: VerifyStatus = 'verifying';
  countdown = 3;

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly onboarding = inject(Onboarding);
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  private countdownInterval: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    const email = this.route.snapshot.queryParamMap.get('email') ?? '';
    const token = this.route.snapshot.queryParamMap.get('token') ?? '';

    if (!email || !token) {
      this.navigateToFailure('Link de verificação inválido ou incompleto.');
      return;
    }

    this.onboarding
      .verifyEmail(email, token)
      .pipe(
        // Atualiza o estado da view imediatamente e inicia o countdown
        // antes de aguardar o checkSession — mantém a UX responsiva.
        tap(() => {
          this.status = 'success';
          this.startCountdown();
        }),
        switchMap(() => this.auth.checkSession()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        error: (err) => {
          this.navigateToFailure(
            err?.error?.detail ?? 'Não foi possível verificar o seu e-mail. O link pode ter expirado.',
          );
        },
      });
  }

  ngOnDestroy(): void {
    this.clearCountdown();
  }

  private navigateToFailure(detail: string): void {
    this.router.navigate(['/onboarding/verify-email-failed'], { queryParams: { detail } });
  }

  private startCountdown(): void {
    this.countdownInterval = setInterval(() => {
      this.countdown--;
      if (this.countdown <= 0) {
        this.clearCountdown();
        this.router.navigate(['/dashboard']);
      }
    }, 1000);
  }

  private clearCountdown(): void {
    if (this.countdownInterval !== null) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
  }
}
