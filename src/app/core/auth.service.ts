import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../models/api-response.model';

const CLAVE_TOKEN = 'auth:token';
const CLAVE_SESION = 'auth:sesion';

export type Rol = 'Admin' | 'Capturista' | 'Consulta';

export interface LoginResult {
  token: string;
  usuario: string;
  rol: Rol;
  expira: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private leer(clave: string): string | null {
    try { return localStorage.getItem(clave); } catch { return null; }
  }

  get token(): string | null {
    return this.leer(CLAVE_TOKEN);
  }

  get sesion(): { usuario: string; rol: Rol; expira: string } | null {
    try { return JSON.parse(this.leer(CLAVE_SESION) ?? 'null'); } catch { return null; }
  }

  get usuario(): string { return this.sesion?.usuario ?? ''; }
  get rol(): Rol | null { return this.sesion?.rol ?? null; }

  get puedeEscribir(): boolean {
    return !environment.authEnabled || this.rol === 'Admin' || this.rol === 'Capturista';
  }

  get esAdmin(): boolean {
    return !environment.authEnabled || this.rol === 'Admin';
  }

  get autenticado(): boolean {
    if (!environment.authEnabled) return true;
    const s = this.sesion;
    return !!this.token && !!s && new Date(s.expira).getTime() > Date.now();
  }

  login(usuario: string, password: string): Observable<ApiResponse<LoginResult>> {
    return this.http
      .post<ApiResponse<LoginResult>>(`${environment.endpoint}Auth/Login`, { usuario, password })
      .pipe(
        tap((r) => {
          if (r.status && r.value) {
            try {
              localStorage.setItem(CLAVE_TOKEN, r.value.token);
              localStorage.setItem(
                CLAVE_SESION,
                JSON.stringify({ usuario: r.value.usuario, rol: r.value.rol, expira: r.value.expira }),
              );
            } catch { }
          }
        }),
      );
  }

  cambiarPassword(actual: string, nueva: string): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(`${environment.endpoint}Auth/CambiarPassword`, { actual, nueva });
  }

  logout() {
    try {
      localStorage.removeItem(CLAVE_TOKEN);
      localStorage.removeItem(CLAVE_SESION);
      Object.keys(localStorage).filter((k) => k.startsWith('cache:')).forEach((k) => localStorage.removeItem(k));
    } catch { }
    this.router.navigateByUrl('/login');
  }
}
