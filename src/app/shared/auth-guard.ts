import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Aguarda a verificação de sessão completar antes de decidir.
  // Se o APP_INITIALIZER já executou checkSession(), o shareReplay(1)
  // retorna o resultado em cache sem fazer nova requisição HTTP.
  return auth.checkSession().pipe(
    map((isAuthenticated) => isAuthenticated ? true : router.createUrlTree(['/'])),
  );
};
