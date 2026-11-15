import { of, throwError } from 'rxjs';
import { conCache } from './cache.util';
import { ApiResponse } from '../models/api-response.model';

describe('conCache', () => {
  beforeEach(() => localStorage.clear());

  it('guarda la lista cuando la API responde status true', (done) => {
    const resp: ApiResponse<number[]> = { status: true, value: [1, 2], msg: '' };
    conCache('t', of(resp)).subscribe(() => {
      expect(JSON.parse(localStorage.getItem('cache:t')!)).toEqual([1, 2]);
      done();
    });
  });

  it('regresa la copia guardada si falla la conexión', (done) => {
    localStorage.setItem('cache:t', JSON.stringify([9]));
    conCache<number>('t', throwError(() => new Error('x'))).subscribe((r) => {
      expect(r.status).toBeTrue();
      expect(r.value).toEqual([9]);
      expect(r.msg).toContain('Sin conexión');
      done();
    });
  });

  it('propaga el error si no hay copia', (done) => {
    conCache<number>('vacio', throwError(() => new Error('x'))).subscribe({
      error: (e) => { expect(e.message).toBe('x'); done(); },
    });
  });
});
