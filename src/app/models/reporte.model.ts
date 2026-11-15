export interface ConteoItem {
  etiqueta: string;
  total: number;
}

export interface ResumenReporte {
  totalAlumnos: number;
  totalMaestros: number;
  totalCarreras: number;
  totalMaterias: number;
  totalInscripciones: number;
  sinCalificar: number;
  aprobados: number;
  reprobados: number;
  promedioGeneral: number | null;
  alumnosPorCarrera: ConteoItem[];
  materiasMasInscritas: ConteoItem[];
}
