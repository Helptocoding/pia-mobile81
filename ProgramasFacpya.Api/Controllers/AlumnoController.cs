using Dapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProgramasFacpya.Api.Common;
using ProgramasFacpya.Api.Data;

namespace ProgramasFacpya.Api.Controllers;

public class Alumno
{
    public int IdAlumno { get; set; }
    public string? Matricula { get; set; }
    public string Nombre { get; set; } = "";
    public string APaterno { get; set; } = "";
    public string AMaterno { get; set; } = "";
    public int IdCarrera { get; set; }
    public string Carrera { get; set; } = "";
    public string? Correo { get; set; }
    public string? Telefono { get; set; }
    public string? FechaNacimiento { get; set; }
    public string FecRegistro { get; set; } = "";
    public int TotalMaterias { get; set; }
    public double? Promedio { get; set; }
}

public class AlumnoDTO
{
    public string? Nombre { get; set; }
    public string? APaterno { get; set; }
    public string? AMaterno { get; set; }
    public int IdCarrera { get; set; }
    public string? Correo { get; set; }
    public string? Telefono { get; set; }
    public DateOnly? FechaNacimiento { get; set; }
}

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class AlumnoController(Db db) : ControllerBase
{
    private const string Select = """
        SELECT a.IdAlumno, a.Matricula, a.Nombre, a.APaterno, a.AMaterno, a.IdCarrera,
               c.Descripcion AS Carrera, a.Correo, a.Telefono, a.FechaNacimiento, a.FecRegistro,
               (SELECT COUNT(*) FROM Inscripcion i WHERE i.IdAlumno = a.IdAlumno) AS TotalMaterias,
               (SELECT ROUND(AVG(i.Calificacion), 1) FROM Inscripcion i
                 WHERE i.IdAlumno = a.IdAlumno AND i.Calificacion IS NOT NULL) AS Promedio
        FROM Alumno a INNER JOIN Carrera c ON c.IdCarrera = a.IdCarrera
        """;

    private static List<string> Validar(AlumnoDTO? d)
    {
        var e = new List<string>();
        e.Nombre(d?.Nombre, "El nombre");
        e.Nombre(d?.APaterno, "El apellido paterno");
        e.Nombre(d?.AMaterno, "El apellido materno");
        if (d is null || d.IdCarrera <= 0) e.Add("Selecciona una carrera");
        e.Correo(d?.Correo);
        e.Telefono(d?.Telefono);
        e.FechaNacimiento(d?.FechaNacimiento);
        return e;
    }

    private static object Params(AlumnoDTO d, int id = 0) => new
    {
        id,
        n = d.Nombre.Limpiar(),
        p = d.APaterno.Limpiar(),
        m = d.AMaterno.Limpiar(),
        carrera = d.IdCarrera,
        correo = string.IsNullOrWhiteSpace(d.Correo) ? null : d.Correo.Trim().ToLowerInvariant(),
        tel = string.IsNullOrWhiteSpace(d.Telefono) ? null : d.Telefono.Trim(),
        nac = d.FechaNacimiento?.ToString("yyyy-MM-dd"),
    };

    [HttpGet("ObtenerTodos")]
    public IActionResult ObtenerTodos()
    {
        using var c = db.Crear();
        return Ok(ApiResponse<List<Alumno>>.Ok(c.Query<Alumno>($"{Select} ORDER BY a.APaterno, a.AMaterno, a.Nombre").ToList()));
    }

    [HttpGet("ObtenerPorId/{id}")]
    public IActionResult ObtenerPorId(int id)
    {
        using var c = db.Crear();
        var x = c.QueryFirstOrDefault<Alumno>($"{Select} WHERE a.IdAlumno = @id", new { id });
        return Ok(x is null ? ApiResponse<Alumno>.Error("El alumno no existe") : ApiResponse<Alumno>.Ok(x));
    }

    [Authorize(Roles = "Admin,Capturista")]
    [HttpPost("Crear")]
    public IActionResult Crear([FromBody] AlumnoDTO dto)
    {
        if (Validar(dto).Primero() is { } err) return Ok(ApiResponse<int>.Error(err));
        var p = Params(dto);
        using var c = db.Crear();
        if (!c.Existe("SELECT COUNT(*) FROM Carrera WHERE IdCarrera = @carrera", p))
            return Ok(ApiResponse<int>.Error("La carrera seleccionada no existe"));
        if (dto.Correo is { Length: > 0 } && c.Existe("SELECT COUNT(*) FROM Alumno WHERE Correo = @correo", p))
            return Ok(ApiResponse<int>.Error("Ya existe un alumno con ese correo"));

        using var tx = c.BeginTransaction();
        var id = c.ExecuteScalar<int>(
            $"""
            INSERT INTO Alumno (Nombre, APaterno, AMaterno, IdCarrera, Correo, Telefono, FechaNacimiento, FecRegistro)
            VALUES (@n, @p, @m, @carrera, @correo, @tel, @nac, {Db.Ahora}); SELECT last_insert_rowid();
            """, p, tx);
        // Matrícula automática: año-consecutivo
        c.Execute("UPDATE Alumno SET Matricula = @mat WHERE IdAlumno = @id",
            new { id, mat = $"{DateTime.Today.Year}-{id:D5}" }, tx);
        tx.Commit();
        return Ok(ApiResponse<int>.Ok(id, "Alumno creado correctamente"));
    }

    [Authorize(Roles = "Admin,Capturista")]
    [HttpPut("Actualizar/{id}")]
    public IActionResult Actualizar(int id, [FromBody] AlumnoDTO dto)
    {
        if (Validar(dto).Primero() is { } err) return Ok(ApiResponse<string>.Error(err));
        var p = Params(dto, id);
        using var c = db.Crear();
        if (!c.Existe("SELECT COUNT(*) FROM Alumno WHERE IdAlumno = @id", p))
            return Ok(ApiResponse<string>.Error("El alumno no existe"));
        if (!c.Existe("SELECT COUNT(*) FROM Carrera WHERE IdCarrera = @carrera", p))
            return Ok(ApiResponse<string>.Error("La carrera seleccionada no existe"));
        if (dto.Correo is { Length: > 0 } && c.Existe("SELECT COUNT(*) FROM Alumno WHERE Correo = @correo AND IdAlumno <> @id", p))
            return Ok(ApiResponse<string>.Error("Ya existe otro alumno con ese correo"));
        c.Execute("""
            UPDATE Alumno SET Nombre=@n, APaterno=@p, AMaterno=@m, IdCarrera=@carrera,
                   Correo=@correo, Telefono=@tel, FechaNacimiento=@nac
            WHERE IdAlumno=@id
            """, p);
        return Ok(ApiResponse<string>.Ok("Alumno actualizado correctamente"));
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("Eliminar/{id}")]
    public IActionResult Eliminar(int id)
    {
        using var c = db.Crear();
        if (!c.Existe("SELECT COUNT(*) FROM Alumno WHERE IdAlumno = @id", new { id }))
            return Ok(ApiResponse<string>.Error("El alumno no existe"));
        var insc = c.ExecuteScalar<int>("SELECT COUNT(*) FROM Inscripcion WHERE IdAlumno = @id", new { id });
        c.Execute("DELETE FROM Alumno WHERE IdAlumno = @id", new { id }); // sus inscripciones se borran en cascada
        return Ok(ApiResponse<string>.Ok(insc > 0
            ? $"Alumno eliminado junto con sus {insc} inscripciones"
            : "Alumno eliminado correctamente"));
    }
}
