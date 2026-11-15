import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { ResumenReporte } from '../models/reporte.model';

@Injectable({ providedIn: 'root' })
export class ReporteService {
  private http = inject(HttpClient);

  resumen(): Observable<ApiResponse<ResumenReporte>> {
    return this.http.get<ApiResponse<ResumenReporte>>(`${environment.endpoint}Reporte/Resumen`);
  }
}
