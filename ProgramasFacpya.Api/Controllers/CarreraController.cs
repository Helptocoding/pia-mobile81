using Dapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProgramasFacpya.Api.Common;
using ProgramasFacpya.Api.Data;

namespace ProgramasFacpya.Api.Controllers;

public class Carrera
{
    public int IdCarrera { get; set; }
    public string Descripcion { get; set; } = "";
    public int TotalAlumnos { get; set; }
}

public class CarreraDTO
{
    public string? Descripcion { get; set; }
}

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class CarreraController(Db db) : ControllerBase
{
    private const string Select = """
        SELECT c.IdCarrera, c.Descripcion,
               (SELECT COUNT(*) FROM Alumno a WHERE a.IdCarrera = c.IdCarrera) AS TotalAlumnos
        FROM Carrera c
        """;

    private static string? Validar(CarreraDTO? dto)
    {
        var d = dto?.Descripcion.Limpiar() ?? "";
        if (d.Length == 0) return "La descripción es obligatoria";
        if (d.Length < 3) return "La descripción debe tener al menos 3 caracteres";
        if (d.Length > 100) return "La descripción no puede pasar de 100 caracteres";
        return null;
    }

    [HttpGet("ObtenerTodos")]
    public IActionResult ObtenerTodos()
    {
        using var c = db.Crear();
        return Ok(ApiResponse<List<Carrera>>.Ok(c.Query<Carrera>($"{Select} ORDER BY c.Descripcion").ToList()));
    }

    [HttpGet("ObtenerPorId/{id}")]
    public IActionResult ObtenerPorId(int id)
    {
        using var c = db.Crear();
        var x = c.QueryFirstOrDefault<Carrera>($"{Select} WHERE c.IdCarrera = @id", new { id });
        return Ok(x is null ? ApiResponse<Carrera>.Error("La carrera no existe") : ApiResponse<Carrera>.Ok(x));
    }

    [Authorize(Roles = "Admin,Capturista")]
    [HttpPost("Crear")]
    public IActionResult Crear([FromBody] CarreraDTO dto)
    {
        if (Validar(dto) is { } err) return Ok(ApiResponse<int>.Error(err));
        var desc = dto.Descripcion.Limpiar();
        using var c = db.Crear();
        if (c.Existe("SELECT COUNT(*) FROM Carrera WHERE Descripcion = @desc", new { desc }))
            return Ok(ApiResponse<int>.Error("Ya existe una carrera con esa descripción"));
        var id = c.ExecuteScalar<int>("INSERT INTO Carrera (Descripcion) VALUES (@desc); SELECT last_insert_rowid();", new { desc });
        return Ok(ApiResponse<int>.Ok(id, "Carrera creada correctamente"));
    }

    [Authorize(Roles = "Admin,Capturista")]
    [HttpPut("Actualizar/{id}")]
    public IActionResult Actualizar(int id, [FromBody] CarreraDTO dto)
    {
        if (Validar(dto) is { } err) return Ok(ApiResponse<string>.Error(err));
        var desc = dto.Descripcion.Limpiar();
        using var c = db.Crear();
        if (!c.Existe("SELECT COUNT(*) FROM Carrera WHERE IdCarrera = @id", new { id }))
            return Ok(ApiResponse<string>.Error("La carrera no existe"));
        if (c.Existe("SELECT COUNT(*) FROM Carrera WHERE Descripcion = @desc AND IdCarrera <> @id", new { desc, id }))
            return Ok(ApiResponse<string>.Error("Ya existe una carrera con esa descripción"));
        c.Execute("UPDATE Carrera SET Descripcion = @desc WHERE IdCarrera = @id", new { desc, id });
        return Ok(ApiResponse<string>.Ok("Carrera actualizada correctamente"));
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("Eliminar/{id}")]
    public IActionResult Eliminar(int id)
    {
        using var c = db.Crear();
        if (!c.Existe("SELECT COUNT(*) FROM Carrera WHERE IdCarrera = @id", new { id }))
            return Ok(ApiResponse<string>.Error("La carrera no existe"));
        if (c.Existe("SELECT COUNT(*) FROM Alumno WHERE IdCarrera = @id", new { id }))
            return Ok(ApiResponse<string>.Error("No se puede eliminar: la carrera tiene alumnos registrados"));
        c.Execute("DELETE FROM Carrera WHERE IdCarrera = @id", new { id });
        return Ok(ApiResponse<string>.Ok("Carrera eliminada correctamente"));
    }
}
