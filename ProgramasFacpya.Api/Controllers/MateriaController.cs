using System.Text.RegularExpressions;
using Dapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProgramasFacpya.Api.Common;
using ProgramasFacpya.Api.Data;

namespace ProgramasFacpya.Api.Controllers;

public class Materia
{
    public int IdMateria { get; set; }
    public string Clave { get; set; } = "";
    public string Nombre { get; set; } = "";
    public int Creditos { get; set; }
    public int? IdMaestro { get; set; }
    public string? Maestro { get; set; }
    public int Inscritos { get; set; }
}

public class MateriaDTO
{
    public string? Clave { get; set; }
    public string? Nombre { get; set; }
    public int Creditos { get; set; }
    public int? IdMaestro { get; set; }
}

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class MateriaController(Db db) : ControllerBase
{
    public const int MaxMateriasPorMaestro = 5;
    private static readonly Regex ClaveRx = new(@"^[A-Za-z0-9]{3,10}$", RegexOptions.Compiled);

    private const string Select = """
        SELECT m.IdMateria, m.Clave, m.Nombre, m.Creditos, m.IdMaestro,
               CASE WHEN t.IdMaestro IS NULL THEN NULL ELSE t.Nombre || ' ' || t.APaterno || ' ' || t.AMaterno END AS Maestro,
               (SELECT COUNT(*) FROM Inscripcion i WHERE i.IdMateria = m.IdMateria) AS Inscritos
        FROM Materia m LEFT JOIN Maestro t ON t.IdMaestro = m.IdMaestro
        """;

    private static List<string> Validar(MateriaDTO? d)
    {
        var e = new List<string>();
        var clave = (d?.Clave ?? "").Trim();
        if (clave.Length == 0) e.Add("La clave es obligatoria");
        else if (!ClaveRx.IsMatch(clave)) e.Add("La clave debe tener de 3 a 10 letras o números");
        var nombre = d?.Nombre.Limpiar() ?? "";
        if (nombre.Length == 0) e.Add("El nombre es obligatorio");
        else if (nombre.Length < 3 || nombre.Length > 100) e.Add("El nombre debe tener de 3 a 100 caracteres");
        if (d is null || d.Creditos < 1 || d.Creditos > 12) e.Add("Los créditos deben estar entre 1 y 12");
        return e;
    }

    private static object Params(MateriaDTO d, int id = 0) => new
    {
        id,
        clave = d.Clave!.Trim().ToUpperInvariant(),
        nombre = d.Nombre.Limpiar(),
        cred = d.Creditos,
        maestro = d.IdMaestro,
    };

    private static string? ValidarMaestro(System.Data.IDbConnection c, int? idMaestro, int idMateria)
    {
        if (idMaestro is null) return null;
        if (!c.Existe("SELECT COUNT(*) FROM Maestro WHERE IdMaestro = @idMaestro", new { idMaestro }))
            return "El maestro seleccionado no existe";
        var actuales = c.ExecuteScalar<int>(
            "SELECT COUNT(*) FROM Materia WHERE IdMaestro = @idMaestro AND IdMateria <> @idMateria", new { idMaestro, idMateria });
        return actuales >= MaxMateriasPorMaestro
            ? $"Un maestro no puede tener más de {MaxMateriasPorMaestro} materias asignadas"
            : null;
    }

    [HttpGet("ObtenerTodos")]
    public IActionResult ObtenerTodos()
    {
        using var c = db.Crear();
        return Ok(ApiResponse<List<Materia>>.Ok(c.Query<Materia>($"{Select} ORDER BY m.Nombre").ToList()));
    }

    [HttpGet("ObtenerPorId/{id}")]
    public IActionResult ObtenerPorId(int id)
    {
        using var c = db.Crear();
        var x = c.QueryFirstOrDefault<Materia>($"{Select} WHERE m.IdMateria = @id", new { id });
        return Ok(x is null ? ApiResponse<Materia>.Error("La materia no existe") : ApiResponse<Materia>.Ok(x));
    }

    [Authorize(Roles = "Admin,Capturista")]
    [HttpPost("Crear")]
    public IActionResult Crear([FromBody] MateriaDTO dto)
    {
        if (Validar(dto).Primero() is { } err) return Ok(ApiResponse<int>.Error(err));
        var p = Params(dto);
        using var c = db.Crear();
        if (c.Existe("SELECT COUNT(*) FROM Materia WHERE Clave = @clave", p))
            return Ok(ApiResponse<int>.Error("Ya existe una materia con esa clave"));
        if (c.Existe("SELECT COUNT(*) FROM Materia WHERE Nombre = @nombre", p))
            return Ok(ApiResponse<int>.Error("Ya existe una materia con ese nombre"));
        if (ValidarMaestro(c, dto.IdMaestro, 0) is { } em) return Ok(ApiResponse<int>.Error(em));
        var id = c.ExecuteScalar<int>(
            "INSERT INTO Materia (Clave, Nombre, Creditos, IdMaestro) VALUES (@clave, @nombre, @cred, @maestro); SELECT last_insert_rowid();", p);
        return Ok(ApiResponse<int>.Ok(id, "Materia creada correctamente"));
    }

    [Authorize(Roles = "Admin,Capturista")]
    [HttpPut("Actualizar/{id}")]
    public IActionResult Actualizar(int id, [FromBody] MateriaDTO dto)
    {
        if (Validar(dto).Primero() is { } err) return Ok(ApiResponse<string>.Error(err));
        var p = Params(dto, id);
        using var c = db.Crear();
        if (!c.Existe("SELECT COUNT(*) FROM Materia WHERE IdMateria = @id", p))
            return Ok(ApiResponse<string>.Error("La materia no existe"));
        if (c.Existe("SELECT COUNT(*) FROM Materia WHERE Clave = @clave AND IdMateria <> @id", p))
            return Ok(ApiResponse<string>.Error("Ya existe otra materia con esa clave"));
        if (c.Existe("SELECT COUNT(*) FROM Materia WHERE Nombre = @nombre AND IdMateria <> @id", p))
            return Ok(ApiResponse<string>.Error("Ya existe otra materia con ese nombre"));
        if (ValidarMaestro(c, dto.IdMaestro, id) is { } em) return Ok(ApiResponse<string>.Error(em));
        c.Execute("UPDATE Materia SET Clave=@clave, Nombre=@nombre, Creditos=@cred, IdMaestro=@maestro WHERE IdMateria=@id", p);
        return Ok(ApiResponse<string>.Ok("Materia actualizada correctamente"));
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("Eliminar/{id}")]
    public IActionResult Eliminar(int id)
    {
        using var c = db.Crear();
        if (!c.Existe("SELECT COUNT(*) FROM Materia WHERE IdMateria = @id", new { id }))
            return Ok(ApiResponse<string>.Error("La materia no existe"));
        if (c.Existe("SELECT COUNT(*) FROM Inscripcion WHERE IdMateria = @id", new { id }))
            return Ok(ApiResponse<string>.Error("No se puede eliminar: la materia tiene alumnos inscritos"));
        c.Execute("DELETE FROM Materia WHERE IdMateria = @id", new { id });
        return Ok(ApiResponse<string>.Ok("Materia eliminada correctamente"));
    }
}
