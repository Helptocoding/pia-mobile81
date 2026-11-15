import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { CalificacionDTO, Inscripcion, InscripcionDTO } from '../models/inscripcion.model';
import { conCache } from '../core/cache.util';

@Injectable({ providedIn: 'root' })
export class InscripcionService {
  private http = inject(HttpClient);
  private url = `${environment.endpoint}Inscripcion`;

  obtenerTodos(): Observable<ApiResponse<Inscripcion[]>> {
    return conCache('inscripciones', this.http.get<ApiResponse<Inscripcion[]>>(`${this.url}/ObtenerTodos`));
  }

  obtenerPorAlumno(idAlumno: number): Observable<ApiResponse<Inscripcion[]>> {
    return this.http.get<ApiResponse<Inscripcion[]>>(`${this.url}/ObtenerPorAlumno/${idAlumno}`);
  }

  obtenerPorMateria(idMateria: number): Observable<ApiResponse<Inscripcion[]>> {
    return this.http.get<ApiResponse<Inscripcion[]>>(`${this.url}/ObtenerPorMateria/${idMateria}`);
  }

  crear(dto: InscripcionDTO): Observable<ApiResponse<number>> {
    return this.http.post<ApiResponse<number>>(`${this.url}/Crear`, dto);
  }

  calificar(id: number, dto: CalificacionDTO): Observable<ApiResponse<string>> {
    return this.http.put<ApiResponse<string>>(`${this.url}/Actualizar/${id}`, dto);
  }

  eliminar(id: number): Observable<ApiResponse<string>> {
    return this.http.delete<ApiResponse<string>>(`${this.url}/Eliminar/${id}`);
  }
}
