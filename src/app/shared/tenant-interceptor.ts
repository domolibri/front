import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../environments/environment';

/**
 * Interceptor para injetar o contexto do Tenant (cliente) em todas as requisições.
 * Em um cenário SaaS real, o ID do tenant seria extraído do subdomínio ou do storage.
 */
export const tenantInterceptor: HttpInterceptorFn = (req, next) => {
  // Ignora requisições fora da nossa API (ex: assets externos)
  if (!req.url.startsWith(environment.apiUrl) && !req.url.startsWith('/api')) {
    return next(req);
  }

  // Tenta obter o tenantId (exemplo vindo do localStorage para POC, 
  // mas idealmente deveria ser extraído do subdomínio de forma segura)
  const tenantId = localStorage.getItem('tenant_id');

  if (tenantId) {
    const tenantReq = req.clone({
      headers: req.headers.set('X-Tenant-ID', tenantId),
    });
    return next(tenantReq);
  }

  return next(req);
};
