import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, take } from 'rxjs';
import { AuthService } from './auth.service';
import { safeInject } from './safe-inject';

export const authGuard: CanActivateFn = () => {
  const auth = safeInject(AuthService, 'authGuard');
  const router = safeInject(Router, 'authGuard');

  if (!auth || !router) {
    // DI tree is broken — redirect unconditionally via native navigation
    // so the user is not silently stuck on a protected page.
    window.location.href = '/';
    return false;
  }

  // Aguarda initialized$ emitir (após checkSession). Com ReplaySubject(1),
  // subscribers tardios recebem o último valor imediatamente,
  // sem disparar nova requisição HTTP.
  return auth.initialized$.pipe(
    take(1),
    map(() => (auth.isAuthenticated() ? true : router.createUrlTree(['/']))),
  );
};
