export interface Materia {
  idMateria: number;
  clave: string;
  nombre: string;
  creditos: number;
  idMaestro: number | null;
  maestro: string | null;
  inscritos: number;
}

export interface MateriaDTO {
  clave: string;
  nombre: string;
  creditos: number;
  idMaestro: number | null;
}
