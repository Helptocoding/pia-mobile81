using Dapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProgramasFacpya.Api.Common;
using ProgramasFacpya.Api.Data;

namespace ProgramasFacpya.Api.Controllers;

public class ConteoItem { public string Etiqueta { get; set; } = ""; public int Total { get; set; } }

public class ResumenReporte
{
    public int TotalAlumnos { get; set; }
    public int TotalMaestros { get; set; }
    public int TotalCarreras { get; set; }
    public int TotalMaterias { get; set; }
    public int TotalInscripciones { get; set; }
    public int SinCalificar { get; set; }
    public int Aprobados { get; set; }
    public int Reprobados { get; set; }
    public double? PromedioGeneral { get; set; }
    public List<ConteoItem> AlumnosPorCarrera { get; set; } = [];
    public List<ConteoItem> MateriasMasInscritas { get; set; } = [];
}

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class ReporteController(Db db) : ControllerBase
{
    public const double Aprobatoria = 70;

    [HttpGet("Resumen")]
    public IActionResult Resumen()
    {
        using var c = db.Crear();
        var r = c.QuerySingle<ResumenReporte>("""
            SELECT (SELECT COUNT(*) FROM Alumno)      AS TotalAlumnos,
                   (SELECT COUNT(*) FROM Maestro)     AS TotalMaestros,
                   (SELECT COUNT(*) FROM Carrera)     AS TotalCarreras,
                   (SELECT COUNT(*) FROM Materia)     AS TotalMaterias,
                   (SELECT COUNT(*) FROM Inscripcion) AS TotalInscripciones,
                   (SELECT COUNT(*) FROM Inscripcion WHERE Calificacion IS NULL) AS SinCalificar,
                   (SELECT COUNT(*) FROM Inscripcion WHERE Calificacion >= @apr) AS Aprobados,
                   (SELECT COUNT(*) FROM Inscripcion WHERE Calificacion <  @apr) AS Reprobados,
                   (SELECT ROUND(AVG(Calificacion), 1) FROM Inscripcion WHERE Calificacion IS NOT NULL) AS PromedioGeneral
            """, new { apr = Aprobatoria });

        r.AlumnosPorCarrera = c.Query<ConteoItem>("""
            SELECT c.Descripcion AS Etiqueta, COUNT(a.IdAlumno) AS Total
            FROM Carrera c LEFT JOIN Alumno a ON a.IdCarrera = c.IdCarrera
            GROUP BY c.IdCarrera ORDER BY Total DESC, c.Descripcion
            """).ToList();

        r.MateriasMasInscritas = c.Query<ConteoItem>("""
            SELECT m.Nombre AS Etiqueta, COUNT(i.IdInscripcion) AS Total
            FROM Materia m LEFT JOIN Inscripcion i ON i.IdMateria = m.IdMateria
            GROUP BY m.IdMateria ORDER BY Total DESC, m.Nombre LIMIT 5
            """).ToList();

        return Ok(ApiResponse<ResumenReporte>.Ok(r));
    }
}
