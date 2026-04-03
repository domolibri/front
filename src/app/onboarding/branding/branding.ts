import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { switchMap, tap } from 'rxjs';
import { Onboarding } from '../../services/onboarding';
import { AuthService } from '../../shared/auth.service';

@Component({
  selector: 'app-branding',
  imports: [],
  templateUrl: './branding.html',
  styleUrl: './branding.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Branding implements OnInit {
  private readonly onboarding = inject(Onboarding);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  corPrimaria = '#0078D4';
  arquivoLogo: File | null = null;
  imagemPreview: string | ArrayBuffer | null = null;
  logoUrlAtual: string | null = null;
  carregandoLogo = false;

  ngOnInit(): void {
    this.carregandoLogo = true;
    this.onboarding
      .getBranding()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          if (data.corPrimaria) this.corPrimaria = data.corPrimaria;
          this.logoUrlAtual = data.logoUrl;
          this.carregandoLogo = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.carregandoLogo = false;
          this.cdr.markForCheck();
        },
      });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    this.arquivoLogo = file;

    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.imagemPreview = reader.result;
        this.cdr.markForCheck();
      };
      reader.readAsDataURL(file);
    } else {
      this.imagemPreview = null;
    }
  }

  voltar(): void {
    this.router.navigate(['/dashboard']);
  }

  salvarBranding(): void {
    this.onboarding
      .updateBranding(this.corPrimaria, this.arquivoLogo)
      .pipe(
        tap(() =>
          document.documentElement.style.setProperty('--cor-primaria', this.corPrimaria),
        ),
        switchMap(() => this.auth.checkSession()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => this.router.navigate(['/dashboard']),
        error: () => alert('Erro ao salvar configurações de branding. Tente novamente.'),
      });
  }
}
