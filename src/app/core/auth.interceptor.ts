import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

/** Agrega el token a cada petición y cierra sesión si la API responde 401. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!environment.authEnabled) return next(req);

  const auth = inject(AuthService);
  const token = auth.token;
  const peticion = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(peticion).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && !req.url.endsWith('Auth/Login')) auth.logout();
      return throwError(() => err);
    }),
  );
};
