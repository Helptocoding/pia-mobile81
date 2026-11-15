import { Observable, catchError, of, tap, throwError } from 'rxjs';
import { ApiResponse } from '../models/api-response.model';

const PREFIX = 'cache:';

/**
 * Guarda la última lista correcta en localStorage. Si falla la conexión,
 * regresa esa copia con un aviso en `msg` en lugar de propagar el error.
 */
export function conCache<T>(
  clave: string,
  fuente$: Observable<ApiResponse<T[]>>,
): Observable<ApiResponse<T[]>> {
  return fuente$.pipe(
    tap((r) => {
      if (r.status) {
        try { localStorage.setItem(PREFIX + clave, JSON.stringify(r.value ?? [])); } catch { /* sin espacio */ }
      }
    }),
    catchError((err) => {
      try {
        const guardado = localStorage.getItem(PREFIX + clave);
        if (guardado) {
          return of<ApiResponse<T[]>>({
            status: true,
            value: JSON.parse(guardado) as T[],
            msg: 'Sin conexión: mostrando datos guardados',
          });
        }
      } catch { /* cache ilegible */ }
      return throwError(() => err);
    }),
  );
}
