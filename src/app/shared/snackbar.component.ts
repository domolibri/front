import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { SnackbarService } from './snackbar.service';

@Component({
  selector: 'app-snackbar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (snackbar.current()) {
      <div class="snackbar snackbar--{{ snackbar.current()!.type }}">
        {{ snackbar.current()!.text }}
      </div>
    }
  `,
  styleUrl: './snackbar.component.scss',
})
export class SnackbarComponent {
  readonly snackbar = inject(SnackbarService);
}
