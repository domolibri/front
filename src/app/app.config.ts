import { APP_INITIALIZER, ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors, withXsrfConfiguration } from '@angular/common/http';

import { routes } from './app.routes';
import { jwtInterceptor } from './shared/jwt-interceptor';
import { tenantInterceptor } from './shared/tenant-interceptor';
import { AuthService } from './shared/auth.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([tenantInterceptor, jwtInterceptor]),
      withXsrfConfiguration({
        cookieName: 'XSRF-TOKEN',
        headerName: 'X-XSRF-TOKEN',
      }),
    ),
    // Verifica sessão ativa (cookie httpOnly) antes de renderizar qualquer rota.
    // Garante que _isAuthenticated$ seja true após reload se o cookie ainda for válido.
    {
      provide: APP_INITIALIZER,
      useFactory: (auth: AuthService) => () => auth.checkSession(),
      deps: [AuthService],
      multi: true,
    },
  ]
};
