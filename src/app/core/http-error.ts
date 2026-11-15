import { HttpErrorResponse } from '@angular/common/http';

/** Texto para el toast cuando la petición falla a nivel HTTP (no cuando la API responde status:false). */
export function mensajeError(err: unknown): string {
  const status = err instanceof HttpErrorResponse ? err.status : 0;
  if (status === 403) return 'No tienes permiso para esta acción';
  if (status === 401) return 'Tu sesión expiró, inicia sesión de nuevo';
  if (status >= 500) return 'Error del servidor, intenta más tarde';
  return 'Error de conexión';
}
