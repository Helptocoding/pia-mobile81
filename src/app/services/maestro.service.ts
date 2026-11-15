import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { conCache } from '../core/cache.util';
import { Maestro, MaestroDTO } from '../models/maestro.model';

@Injectable({ providedIn: 'root' })
export class MaestroService {
  private http = inject(HttpClient);
  private url = `${environment.endpoint}Maestro`;

  obtenerTodos(): Observable<ApiResponse<Maestro[]>> {
    return conCache('maestros', this.http.get<ApiResponse<Maestro[]>>(`${this.url}/ObtenerTodos`));
  }

  obtenerPorId(id: number): Observable<ApiResponse<Maestro>> {
    return this.http.get<ApiResponse<Maestro>>(`${this.url}/ObtenerPorId/${id}`);
  }

  crear(dto: MaestroDTO): Observable<ApiResponse<number>> {
    return this.http.post<ApiResponse<number>>(`${this.url}/Crear`, dto);
  }

  actualizar(id: number, dto: MaestroDTO): Observable<ApiResponse<string>> {
    return this.http.put<ApiResponse<string>>(`${this.url}/Actualizar/${id}`, dto);
  }

  eliminar(id: number): Observable<ApiResponse<string>> {
    return this.http.delete<ApiResponse<string>>(`${this.url}/Eliminar/${id}`);
  }
}
