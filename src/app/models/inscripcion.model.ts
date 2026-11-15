export interface Inscripcion {
  idInscripcion: number;
  idAlumno: number;
  alumno: string;
  matricula: string | null;
  idMateria: number;
  clave: string;
  materia: string;
  creditos: number;
  calificacion: number | null;
  fecInscripcion: string;
}

export interface InscripcionDTO {
  idAlumno: number;
  idMateria: number;
}

export interface CalificacionDTO {
  calificacion: number | null;
}
