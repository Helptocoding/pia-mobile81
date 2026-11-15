using Dapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProgramasFacpya.Api.Common;
using ProgramasFacpya.Api.Data;

namespace ProgramasFacpya.Api.Controllers;

public class Maestro
{
    public int IdMaestro { get; set; }
    public string Nombre { get; set; } = "";
    public string APaterno { get; set; } = "";
    public string AMaterno { get; set; } = "";
    public string? Correo { get; set; }
    public string? Telefono { get; set; }
    public string? Especialidad { get; set; }
    public string FecRegistro { get; set; } = "";
    public int TotalMaterias { get; set; }
}

public class MaestroDTO
{
    public string? Nombre { get; set; }
    public string? APaterno { get; set; }
    public string? AMaterno { get; set; }
    public string? Correo { get; set; }
    public string? Telefono { get; set; }
    public string? Especialidad { get; set; }
}

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class MaestroController(Db db) : ControllerBase
{
    private const string Select = """
        SELECT m.IdMaestro, m.Nombre, m.APaterno, m.AMaterno, m.Correo, m.Telefono, m.Especialidad, m.FecRegistro,
               (SELECT COUNT(*) FROM Materia x WHERE x.IdMaestro = m.IdMaestro) AS TotalMaterias
        FROM Maestro m
        """;

    private static List<string> Validar(MaestroDTO? d)
    {
        var e = new List<string>();
        e.Nombre(d?.Nombre, "El nombre");
        e.Nombre(d?.APaterno, "El apellido paterno");
        e.Nombre(d?.AMaterno, "El apellido materno");
        e.Correo(d?.Correo);
        e.Telefono(d?.Telefono);
        if (d?.Especialidad.Limpiar().Length > 60) e.Add("La especialidad no puede pasar de 60 caracteres");
        return e;
    }

    private static object Params(MaestroDTO d, int id = 0) => new
    {
        id,
        n = d.Nombre.Limpiar(),
        p = d.APaterno.Limpiar(),
        m = d.AMaterno.Limpiar(),
        correo = string.IsNullOrWhiteSpace(d.Correo) ? null : d.Correo.Trim().ToLowerInvariant(),
        tel = string.IsNullOrWhiteSpace(d.Telefono) ? null : d.Telefono.Trim(),
        esp = string.IsNullOrWhiteSpace(d.Especialidad) ? null : d.Especialidad.Limpiar(),
    };

    [HttpGet("ObtenerTodos")]
    public IActionResult ObtenerTodos()
    {
        using var c = db.Crear();
        return Ok(ApiResponse<List<Maestro>>.Ok(c.Query<Maestro>($"{Select} ORDER BY m.APaterno, m.AMaterno, m.Nombre").ToList()));
    }

    [HttpGet("ObtenerPorId/{id}")]
    public IActionResult ObtenerPorId(int id)
    {
        using var c = db.Crear();
        var x = c.QueryFirstOrDefault<Maestro>($"{Select} WHERE m.IdMaestro = @id", new { id });
        return Ok(x is null ? ApiResponse<Maestro>.Error("El maestro no existe") : ApiResponse<Maestro>.Ok(x));
    }

    [Authorize(Roles = "Admin,Capturista")]
    [HttpPost("Crear")]
    public IActionResult Crear([FromBody] MaestroDTO dto)
    {
        if (Validar(dto).Primero() is { } err) return Ok(ApiResponse<int>.Error(err));
        var p = Params(dto);
        using var c = db.Crear();
        if (dto.Correo is { Length: > 0 } && c.Existe("SELECT COUNT(*) FROM Maestro WHERE Correo = @correo", p))
            return Ok(ApiResponse<int>.Error("Ya existe un maestro con ese correo"));
        var id = c.ExecuteScalar<int>(
            $"""
            INSERT INTO Maestro (Nombre, APaterno, AMaterno, Correo, Telefono, Especialidad, FecRegistro)
            VALUES (@n, @p, @m, @correo, @tel, @esp, {Db.Ahora}); SELECT last_insert_rowid();
            """, p);
        return Ok(ApiResponse<int>.Ok(id, "Maestro creado correctamente"));
    }

    [Authorize(Roles = "Admin,Capturista")]
    [HttpPut("Actualizar/{id}")]
    public IActionResult Actualizar(int id, [FromBody] MaestroDTO dto)
    {
        if (Validar(dto).Primero() is { } err) return Ok(ApiResponse<string>.Error(err));
        var p = Params(dto, id);
        using var c = db.Crear();
        if (!c.Existe("SELECT COUNT(*) FROM Maestro WHERE IdMaestro = @id", p))
            return Ok(ApiResponse<string>.Error("El maestro no existe"));
        if (dto.Correo is { Length: > 0 } && c.Existe("SELECT COUNT(*) FROM Maestro WHERE Correo = @correo AND IdMaestro <> @id", p))
            return Ok(ApiResponse<string>.Error("Ya existe otro maestro con ese correo"));
        c.Execute("UPDATE Maestro SET Nombre=@n, APaterno=@p, AMaterno=@m, Correo=@correo, Telefono=@tel, Especialidad=@esp WHERE IdMaestro=@id", p);
        return Ok(ApiResponse<string>.Ok("Maestro actualizado correctamente"));
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("Eliminar/{id}")]
    public IActionResult Eliminar(int id)
    {
        using var c = db.Crear();
        if (!c.Existe("SELECT COUNT(*) FROM Maestro WHERE IdMaestro = @id", new { id }))
            return Ok(ApiResponse<string>.Error("El maestro no existe"));
        if (c.Existe("SELECT COUNT(*) FROM Materia WHERE IdMaestro = @id", new { id }))
            return Ok(ApiResponse<string>.Error("No se puede eliminar: el maestro tiene materias asignadas"));
        c.Execute("DELETE FROM Maestro WHERE IdMaestro = @id", new { id });
        return Ok(ApiResponse<string>.Ok("Maestro eliminado correctamente"));
    }
}
