import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Onboarding } from '../../services/onboarding';
import { AuthService } from '../../shared/auth.service';

@Component({
  selector: 'app-branding',
  imports: [FormsModule],
  templateUrl: './branding.html',
  styleUrl: './branding.scss',
})
export class Branding {
  private readonly onboarding = inject(Onboarding);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  corPrimaria = '#0078D4';
  arquivoLogo: File | null = null;
  imagemPreview: string | ArrayBuffer | null = null;

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    this.arquivoLogo = file;

    if (file) {
      const reader = new FileReader();
      reader.onload = () => (this.imagemPreview = reader.result);
      reader.readAsDataURL(file);
    } else {
      this.imagemPreview = null;
    }
  }

  salvarBranding(): void {
    this.onboarding.updateBranding(this.corPrimaria, this.arquivoLogo).subscribe({
      next: () => {
        document.documentElement.style.setProperty('--cor-primaria', this.corPrimaria);
        this.auth.checkSession().subscribe(() => {
          this.router.navigate(['/dashboard']);
        });
      },
      error: () => {
        alert('Erro ao salvar configurações de branding. Tente novamente.');
      },
    });
  }
}
