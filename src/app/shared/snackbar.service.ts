import { Injectable, signal } from '@angular/core';

export type SnackbarType = 'success' | 'error' | 'info';

export interface SnackbarMessage {
  text: string;
  type: SnackbarType;
}

@Injectable({ providedIn: 'root' })
export class SnackbarService {
  readonly current = signal<SnackbarMessage | null>(null);

  show(text: string, type: SnackbarType = 'success', duration = 4000): void {
    this.current.set({ text, type });
    setTimeout(() => this.current.set(null), duration);
  }
}
