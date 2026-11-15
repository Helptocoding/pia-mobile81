const SOLO_LETRAS = /^\p{L}[\p{L} .'\-]*$/u;
const CORREO = /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/;

export const limpiar = (s: string | null | undefined) => (s ?? '').trim().replace(/\s+/g, ' ');

export function nombreInvalido(s: string | null | undefined, min = 2, max = 50): boolean {
  const t = limpiar(s);
  return t.length < min || t.length > max || !SOLO_LETRAS.test(t);
}

export const correoInvalido = (s: string | null | undefined) => !!limpiar(s) && !CORREO.test(limpiar(s));
export const telefonoInvalido = (s: string | null | undefined) => !!limpiar(s) && !/^\d{10}$/.test(limpiar(s));

export function fechaNacimientoInvalida(s: string | null | undefined): boolean {
  if (!s) return false;
  const f = new Date(s + 'T00:00:00');
  if (isNaN(f.getTime())) return true;
  const hoy = new Date();
  if (f > hoy) return true;
  let edad = hoy.getFullYear() - f.getFullYear();
  if (hoy < new Date(hoy.getFullYear(), f.getMonth(), f.getDate())) edad--;
  return edad < 15 || edad > 100;
}
