export interface Maestro {
  idMaestro: number;
  nombre: string;
  aPaterno: string;
  aMaterno: string;
  correo: string | null;
  telefono: string | null;
  especialidad: string | null;
  fecRegistro: string;
  totalMaterias: number;
}

export interface MaestroDTO {
  nombre: string;
  aPaterno: string;
  aMaterno: string;
  correo?: string | null;
  telefono?: string | null;
  especialidad?: string | null;
}
