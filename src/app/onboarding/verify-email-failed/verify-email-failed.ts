import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-verify-email-failed',
  imports: [RouterLink],
  templateUrl: './verify-email-failed.html',
  styleUrl: './verify-email-failed.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VerifyEmailFailed implements OnInit {
  detail = '';

  private readonly route = inject(ActivatedRoute);

  ngOnInit(): void {
    this.detail =
      this.route.snapshot.queryParamMap.get('detail') ??
      'Não foi possível verificar o seu e-mail. O link pode ter expirado ou já foi utilizado.';
  }
}
