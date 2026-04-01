import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, take } from 'rxjs';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Aguarda initialized$ emitir (após checkSession ou setAuthenticated).
  // Com ReplaySubject(1), subscribers tardios recebem o último valor imediatamente,
  // sem disparar nova requisição HTTP.
  return auth.initialized$.pipe(
    take(1),
    map(() => auth.isAuthenticated() ? true : router.createUrlTree(['/'])),
  );
};
