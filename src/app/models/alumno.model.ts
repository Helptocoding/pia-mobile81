export interface Alumno {
  idAlumno: number;
  matricula: string | null;
  nombre: string;
  aPaterno: string;
  aMaterno: string;
  idCarrera: number;
  carrera?: string;
  correo: string | null;
  telefono: string | null;
  fechaNacimiento: string | null;
  fecRegistro: string;
  totalMaterias: number;
  promedio: number | null;
}

export interface AlumnoDTO {
  nombre: string;
  aPaterno: string;
  aMaterno: string;
  idCarrera: number;
  correo?: string | null;
  telefono?: string | null;
  fechaNacimiento?: string | null;
}
