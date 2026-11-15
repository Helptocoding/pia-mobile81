import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { conCache } from '../core/cache.util';
import { Alumno, AlumnoDTO } from '../models/alumno.model';

@Injectable({ providedIn: 'root' })
export class AlumnoService {
  private http = inject(HttpClient);
  private url = `${environment.endpoint}Alumno`;

  obtenerTodos(): Observable<ApiResponse<Alumno[]>> {
    return conCache('alumnos', this.http.get<ApiResponse<Alumno[]>>(`${this.url}/ObtenerTodos`));
  }

  obtenerPorId(id: number): Observable<ApiResponse<Alumno>> {
    return this.http.get<ApiResponse<Alumno>>(`${this.url}/ObtenerPorId/${id}`);
  }

  crear(dto: AlumnoDTO): Observable<ApiResponse<number>> {
    return this.http.post<ApiResponse<number>>(`${this.url}/Crear`, dto);
  }

  actualizar(id: number, dto: AlumnoDTO): Observable<ApiResponse<string>> {
    return this.http.put<ApiResponse<string>>(`${this.url}/Actualizar/${id}`, dto);
  }

  eliminar(id: number): Observable<ApiResponse<string>> {
    return this.http.delete<ApiResponse<string>>(`${this.url}/Eliminar/${id}`);
  }
}
