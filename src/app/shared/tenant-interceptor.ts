import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { safeInject } from './safe-inject';

/**
 * Interceptor para injetar o contexto do Tenant (cliente) em todas as requisições.
 * O tenantId é obtido do estado do AuthService, preenchido após o login.
 */
export const tenantInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.apiUrl) && !req.url.startsWith('/api')) {
    return next(req);
  }

  const authService = safeInject(AuthService, 'tenantInterceptor');

  if (!authService) {
    // DI failed — forward the request without the tenant header.
    // The API will reject unauthorized requests normally.
    return next(req);
  }

  const tenantId = authService.currentUser?.tenantId;

  if (authService.isAuthenticated() && tenantId) {
    const tenantReq = req.clone({
      headers: req.headers.set('X-Tenant-ID', tenantId),
    });
    return next(tenantReq);
  }

  return next(req);
};
