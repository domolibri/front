import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AsyncPipe, UpperCasePipe } from '@angular/common';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, AsyncPipe, UpperCasePipe],
  templateUrl: './app-shell.html',
  styleUrl: './app-shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppShell {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected logout(): void {
    this.auth.logout();
    this.router.navigate(['/']);
  }
}
