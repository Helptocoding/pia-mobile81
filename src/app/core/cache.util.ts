import { Observable, catchError, of, tap, throwError } from 'rxjs';
import { ApiResponse } from '../models/api-response.model';

const PREFIX = 'cache:';

export function conCache<T>(
  clave: string,
  fuente$: Observable<ApiResponse<T[]>>,
): Observable<ApiResponse<T[]>> {
  return fuente$.pipe(
    tap((r) => {
      if (r.status) {
        try { localStorage.setItem(PREFIX + clave, JSON.stringify(r.value ?? [])); } catch { }
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
      } catch { }
      return throwError(() => err);
    }),
  );
}
