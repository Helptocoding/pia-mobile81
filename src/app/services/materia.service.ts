import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { Materia, MateriaDTO } from '../models/materia.model';
import { conCache } from '../core/cache.util';

@Injectable({ providedIn: 'root' })
export class MateriaService {
  private http = inject(HttpClient);
  private url = `${environment.endpoint}Materia`;

  obtenerTodos(): Observable<ApiResponse<Materia[]>> {
    return conCache('materias', this.http.get<ApiResponse<Materia[]>>(`${this.url}/ObtenerTodos`));
  }

  obtenerPorId(id: number): Observable<ApiResponse<Materia>> {
    return this.http.get<ApiResponse<Materia>>(`${this.url}/ObtenerPorId/${id}`);
  }

  crear(dto: MateriaDTO): Observable<ApiResponse<number>> {
    return this.http.post<ApiResponse<number>>(`${this.url}/Crear`, dto);
  }

  actualizar(id: number, dto: MateriaDTO): Observable<ApiResponse<string>> {
    return this.http.put<ApiResponse<string>>(`${this.url}/Actualizar/${id}`, dto);
  }

  eliminar(id: number): Observable<ApiResponse<string>> {
    return this.http.delete<ApiResponse<string>>(`${this.url}/Eliminar/${id}`);
  }
}
