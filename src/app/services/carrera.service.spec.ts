import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { CarreraService } from './carrera.service';
import { environment } from '../../environments/environment';

describe('CarreraService', () => {
  let svc: CarreraService;
  let http: HttpTestingController;
  const base = `${environment.endpoint}Carrera`;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    svc = TestBed.inject(CarreraService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('obtenerTodos hace GET a ObtenerTodos', () => {
    svc.obtenerTodos().subscribe();
    const req = http.expectOne(`${base}/ObtenerTodos`);
    expect(req.request.method).toBe('GET');
    req.flush({ status: true, value: [], msg: '' });
  });

  it('crear hace POST con la descripción', () => {
    svc.crear({ descripcion: 'ISC' }).subscribe();
    const req = http.expectOne(`${base}/Crear`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ descripcion: 'ISC' });
    req.flush({ status: true, value: 1, msg: 'ok' });
  });

  it('actualizar hace PUT con el id', () => {
    svc.actualizar(3, { descripcion: 'X' }).subscribe();
    expect(http.expectOne(`${base}/Actualizar/3`).request.method).toBe('PUT');
  });

  it('eliminar hace DELETE con el id', () => {
    svc.eliminar(3).subscribe();
    expect(http.expectOne(`${base}/Eliminar/3`).request.method).toBe('DELETE');
  });
});
