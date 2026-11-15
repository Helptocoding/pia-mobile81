import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { conCache } from '../core/cache.util';
import { Carrera, CarreraDTO } from '../models/carrera.model';

@Injectable({ providedIn: 'root' })
export class CarreraService {
  private http = inject(HttpClient);
  private url = `${environment.endpoint}Carrera`;

  obtenerTodos(): Observable<ApiResponse<Carrera[]>> {
    return conCache('carreras', this.http.get<ApiResponse<Carrera[]>>(`${this.url}/ObtenerTodos`));
  }

  obtenerPorId(id: number): Observable<ApiResponse<Carrera>> {
    return this.http.get<ApiResponse<Carrera>>(`${this.url}/ObtenerPorId/${id}`);
  }

  crear(dto: CarreraDTO): Observable<ApiResponse<number>> {
    return this.http.post<ApiResponse<number>>(`${this.url}/Crear`, dto);
  }

  actualizar(id: number, dto: CarreraDTO): Observable<ApiResponse<string>> {
    return this.http.put<ApiResponse<string>>(`${this.url}/Actualizar/${id}`, dto);
  }

  eliminar(id: number): Observable<ApiResponse<string>> {
    return this.http.delete<ApiResponse<string>>(`${this.url}/Eliminar/${id}`);
  }
}
