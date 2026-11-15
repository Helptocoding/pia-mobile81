using Dapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProgramasFacpya.Api.Common;
using ProgramasFacpya.Api.Data;

namespace ProgramasFacpya.Api.Controllers;

public class Inscripcion
{
    public int IdInscripcion { get; set; }
    public int IdAlumno { get; set; }
    public string Alumno { get; set; } = "";
    public string? Matricula { get; set; }
    public int IdMateria { get; set; }
    public string Clave { get; set; } = "";
    public string Materia { get; set; } = "";
    public int Creditos { get; set; }
    public double? Calificacion { get; set; }
    public string FecInscripcion { get; set; } = "";
}

public class InscripcionDTO
{
    public int IdAlumno { get; set; }
    public int IdMateria { get; set; }
}

public class CalificacionDTO
{

    public double? Calificacion { get; set; }
}

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class InscripcionController(Db db) : ControllerBase
{
    public const int MaxMateriasPorAlumno = 6;
    public const int CupoPorMateria = 30;

    private const string Select = """
        SELECT i.IdInscripcion, i.IdAlumno,
               a.Nombre || ' ' || a.APaterno || ' ' || a.AMaterno AS Alumno, a.Matricula,
               i.IdMateria, m.Clave, m.Nombre AS Materia, m.Creditos,
               i.Calificacion, i.FecInscripcion
        FROM Inscripcion i
        INNER JOIN Alumno a ON a.IdAlumno = i.IdAlumno
        INNER JOIN Materia m ON m.IdMateria = i.IdMateria
        """;

    [HttpGet("ObtenerTodos")]
    public IActionResult ObtenerTodos()
    {
        using var c = db.Crear();
        return Ok(ApiResponse<List<Inscripcion>>.Ok(c.Query<Inscripcion>($"{Select} ORDER BY i.FecInscripcion DESC, i.IdInscripcion DESC").ToList()));
    }

    [HttpGet("ObtenerPorAlumno/{idAlumno}")]
    public IActionResult ObtenerPorAlumno(int idAlumno)
    {
        using var c = db.Crear();
        if (!c.Existe("SELECT COUNT(*) FROM Alumno WHERE IdAlumno = @idAlumno", new { idAlumno }))
            return Ok(ApiResponse<List<Inscripcion>>.Error("El alumno no existe"));
        return Ok(ApiResponse<List<Inscripcion>>.Ok(c.Query<Inscripcion>($"{Select} WHERE i.IdAlumno = @idAlumno ORDER BY m.Nombre", new { idAlumno }).ToList()));
    }

    [HttpGet("ObtenerPorMateria/{idMateria}")]
    public IActionResult ObtenerPorMateria(int idMateria)
    {
        using var c = db.Crear();
        if (!c.Existe("SELECT COUNT(*) FROM Materia WHERE IdMateria = @idMateria", new { idMateria }))
            return Ok(ApiResponse<List<Inscripcion>>.Error("La materia no existe"));
        return Ok(ApiResponse<List<Inscripcion>>.Ok(c.Query<Inscripcion>($"{Select} WHERE i.IdMateria = @idMateria ORDER BY a.APaterno, a.Nombre", new { idMateria }).ToList()));
    }

    [HttpGet("ObtenerPorId/{id}")]
    public IActionResult ObtenerPorId(int id)
    {
        using var c = db.Crear();
        var x = c.QueryFirstOrDefault<Inscripcion>($"{Select} WHERE i.IdInscripcion = @id", new { id });
        return Ok(x is null ? ApiResponse<Inscripcion>.Error("La inscripción no existe") : ApiResponse<Inscripcion>.Ok(x));
    }

    [Authorize(Roles = "Admin,Capturista")]
    [HttpPost("Crear")]
    public IActionResult Crear([FromBody] InscripcionDTO dto)
    {
        if (dto.IdAlumno <= 0) return Ok(ApiResponse<int>.Error("Selecciona un alumno"));
        if (dto.IdMateria <= 0) return Ok(ApiResponse<int>.Error("Selecciona una materia"));

        using var c = db.Crear();
        if (!c.Existe("SELECT COUNT(*) FROM Alumno WHERE IdAlumno = @IdAlumno", dto))
            return Ok(ApiResponse<int>.Error("El alumno no existe"));
        if (!c.Existe("SELECT COUNT(*) FROM Materia WHERE IdMateria = @IdMateria", dto))
            return Ok(ApiResponse<int>.Error("La materia no existe"));
        if (c.Existe("SELECT COUNT(*) FROM Inscripcion WHERE IdAlumno = @IdAlumno AND IdMateria = @IdMateria", dto))
            return Ok(ApiResponse<int>.Error("El alumno ya está inscrito en esa materia"));
        if (c.ExecuteScalar<int>("SELECT COUNT(*) FROM Inscripcion WHERE IdAlumno = @IdAlumno", dto) >= MaxMateriasPorAlumno)
            return Ok(ApiResponse<int>.Error($"Un alumno no puede inscribirse a más de {MaxMateriasPorAlumno} materias"));
        if (c.ExecuteScalar<int>("SELECT COUNT(*) FROM Inscripcion WHERE IdMateria = @IdMateria", dto) >= CupoPorMateria)
            return Ok(ApiResponse<int>.Error($"La materia alcanzó su cupo de {CupoPorMateria} alumnos"));

        var id = c.ExecuteScalar<int>(
            $"INSERT INTO Inscripcion (IdAlumno, IdMateria, FecInscripcion) VALUES (@IdAlumno, @IdMateria, {Db.Ahora}); SELECT last_insert_rowid();", dto);
        return Ok(ApiResponse<int>.Ok(id, "Inscripción creada correctamente"));
    }

    [Authorize(Roles = "Admin,Capturista")]
    [HttpPut("Actualizar/{id}")]
    public IActionResult Actualizar(int id, [FromBody] CalificacionDTO dto)
    {
        if (dto.Calificacion is { } cal && (double.IsNaN(cal) || cal < 0 || cal > 100))
            return Ok(ApiResponse<string>.Error("La calificación debe estar entre 0 y 100"));
        using var c = db.Crear();
        var filas = c.Execute("UPDATE Inscripcion SET Calificacion = @cal WHERE IdInscripcion = @id",
            new { id, cal = dto.Calificacion is { } v ? Math.Round(v, 1) : (double?)null });
        return Ok(filas == 0
            ? ApiResponse<string>.Error("La inscripción no existe")
            : ApiResponse<string>.Ok("Calificación actualizada correctamente"));
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("Eliminar/{id}")]
    public IActionResult Eliminar(int id)
    {
        using var c = db.Crear();
        var filas = c.Execute("DELETE FROM Inscripcion WHERE IdInscripcion = @id", new { id });
        return Ok(filas == 0
            ? ApiResponse<string>.Error("La inscripción no existe")
            : ApiResponse<string>.Ok("Inscripción eliminada correctamente"));
    }
}
