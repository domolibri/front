import { HttpInterceptorFn } from '@angular/common/http';

/**
 * We no longer manually attach the Authorization header from localStorage.
 * Instead, we set withCredentials = true to allow the browser to 
 * automatically include the HttpOnly secure cookie in every request.
 */
export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const secureReq = req.clone({
    withCredentials: true
  });
  
  return next(secureReq);
};
