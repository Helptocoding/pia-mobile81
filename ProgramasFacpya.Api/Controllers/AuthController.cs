using System.Collections.Concurrent;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Text.RegularExpressions;
using Dapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using ProgramasFacpya.Api.Common;
using ProgramasFacpya.Api.Data;

namespace ProgramasFacpya.Api.Controllers;

public class LoginDTO { public string? Usuario { get; set; } public string? Password { get; set; } }
public class LoginResult { public string Token { get; set; } = ""; public string Usuario { get; set; } = ""; public string Rol { get; set; } = ""; public DateTime Expira { get; set; } }
public class RegistrarDTO { public string? Usuario { get; set; } public string? Password { get; set; } public string? Rol { get; set; } }
public class CambiarPasswordDTO { public string? Actual { get; set; } public string? Nueva { get; set; } }
public class UsuarioInfo { public int IdUsuario { get; set; } public string NombreUsuario { get; set; } = ""; public string Rol { get; set; } = ""; public string FecRegistro { get; set; } = ""; }

[ApiController]
[Route("api/[controller]")]
public class AuthController(Db db, IConfiguration config) : ControllerBase
{
    private static readonly string[] Roles = ["Admin", "Capturista", "Consulta"];
    private static readonly Regex UsuarioRx = new(@"^[a-zA-Z0-9_.\-]{3,30}$", RegexOptions.Compiled);

    private const int MaxIntentos = 5;
    private static readonly TimeSpan Bloqueo = TimeSpan.FromMinutes(5);
    private static readonly ConcurrentDictionary<string, (int Fallos, DateTime? Hasta)> Intentos = new();

    private class UsuarioFila
    {
        public int IdUsuario { get; set; }
        public string NombreUsuario { get; set; } = "";
        public string PasswordHash { get; set; } = "";
        public string Rol { get; set; } = "";
    }

    [HttpPost("Login")]
    public IActionResult Login([FromBody] LoginDTO dto)
    {
        var usuario = (dto.Usuario ?? "").Trim();
        if (usuario.Length == 0 || string.IsNullOrEmpty(dto.Password))
            return Ok(ApiResponse<LoginResult>.Error("Usuario y contraseña son obligatorios"));

        var clave = usuario.ToLowerInvariant();
        if (Intentos.TryGetValue(clave, out var est) && est.Hasta is { } hasta && hasta > DateTime.UtcNow)
        {
            var min = (int)Math.Ceiling((hasta - DateTime.UtcNow).TotalMinutes);
            return Ok(ApiResponse<LoginResult>.Error($"Demasiados intentos fallidos. Intenta de nuevo en {min} min"));
        }

        using var c = db.Crear();
        var u = c.QueryFirstOrDefault<UsuarioFila>(
            "SELECT IdUsuario, NombreUsuario, PasswordHash, Rol FROM Usuario WHERE NombreUsuario = @usuario", new { usuario });

        if (u is null || !PasswordHasher.Verificar(dto.Password, u.PasswordHash))
        {
            var fallos = Intentos.AddOrUpdate(clave, (1, null), (_, v) => (v.Fallos + 1, null)).Fallos;
            if (fallos >= MaxIntentos) Intentos[clave] = (0, DateTime.UtcNow.Add(Bloqueo));
            return Ok(ApiResponse<LoginResult>.Error("Usuario o contraseña incorrectos"));
        }

        Intentos.TryRemove(clave, out _);
        var expira = DateTime.UtcNow.AddHours(config.GetValue("Jwt:HorasVigencia", 8));
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, u.IdUsuario.ToString()),
            new Claim(ClaimTypes.Name, u.NombreUsuario),
            new Claim(ClaimTypes.Role, u.Rol),
        };
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(config["Jwt:Key"]!));
        var token = new JwtSecurityToken(
            config["Jwt:Issuer"], config["Jwt:Audience"], claims,
            expires: expira, signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256));

        return Ok(ApiResponse<LoginResult>.Ok(new LoginResult
        {
            Token = new JwtSecurityTokenHandler().WriteToken(token),
            Usuario = u.NombreUsuario,
            Rol = u.Rol,
            Expira = expira,
        }));
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("Registrar")]
    public IActionResult Registrar([FromBody] RegistrarDTO dto)
    {
        var e = new List<string>();
        var usuario = (dto.Usuario ?? "").Trim();
        if (!UsuarioRx.IsMatch(usuario)) e.Add("El usuario debe tener de 3 a 30 caracteres (letras, números, . _ -)");
        e.Password(dto.Password);
        if (!Roles.Contains(dto.Rol)) e.Add($"El rol debe ser: {string.Join(", ", Roles)}");
        if (e.Primero() is { } err) return Ok(ApiResponse<int>.Error(err));

        using var c = db.Crear();
        if (c.Existe("SELECT COUNT(*) FROM Usuario WHERE NombreUsuario = @usuario", new { usuario }))
            return Ok(ApiResponse<int>.Error("Ya existe un usuario con ese nombre"));
        var id = c.ExecuteScalar<int>(
            $"INSERT INTO Usuario (NombreUsuario, PasswordHash, Rol, FecRegistro) VALUES (@usuario, @hash, @rol, {Db.Ahora}); SELECT last_insert_rowid();",
            new { usuario, hash = PasswordHasher.Hash(dto.Password!), rol = dto.Rol });
        return Ok(ApiResponse<int>.Ok(id, "Usuario creado correctamente"));
    }

    [Authorize]
    [HttpPost("CambiarPassword")]
    public IActionResult CambiarPassword([FromBody] CambiarPasswordDTO dto)
    {
        var e = new List<string>();
        if (string.IsNullOrEmpty(dto.Actual)) e.Add("La contraseña actual es obligatoria");
        e.Password(dto.Nueva, "La nueva contraseña");
        if (dto.Actual == dto.Nueva && !string.IsNullOrEmpty(dto.Nueva)) e.Add("La nueva contraseña debe ser distinta a la actual");
        if (e.Primero() is { } err) return Ok(ApiResponse<string>.Error(err));

        var id = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        using var c = db.Crear();
        var hash = c.QueryFirstOrDefault<string>("SELECT PasswordHash FROM Usuario WHERE IdUsuario = @id", new { id });
        if (hash is null || !PasswordHasher.Verificar(dto.Actual!, hash))
            return Ok(ApiResponse<string>.Error("La contraseña actual es incorrecta"));
        c.Execute("UPDATE Usuario SET PasswordHash = @h WHERE IdUsuario = @id", new { h = PasswordHasher.Hash(dto.Nueva!), id });
        return Ok(ApiResponse<string>.Ok("Contraseña actualizada correctamente"));
    }

    [Authorize(Roles = "Admin")]
    [HttpGet("Usuarios")]
    public IActionResult Usuarios()
    {
        using var c = db.Crear();
        return Ok(ApiResponse<List<UsuarioInfo>>.Ok(
            c.Query<UsuarioInfo>("SELECT IdUsuario, NombreUsuario, Rol, FecRegistro FROM Usuario ORDER BY NombreUsuario").ToList()));
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("Usuarios/{id}")]
    public IActionResult EliminarUsuario(int id)
    {
        if (id.ToString() == User.FindFirstValue(ClaimTypes.NameIdentifier))
            return Ok(ApiResponse<string>.Error("No puedes eliminar tu propio usuario"));
        using var c = db.Crear();
        var rol = c.QueryFirstOrDefault<string>("SELECT Rol FROM Usuario WHERE IdUsuario = @id", new { id });
        if (rol is null) return Ok(ApiResponse<string>.Error("El usuario no existe"));
        if (rol == "Admin" && c.ExecuteScalar<int>("SELECT COUNT(*) FROM Usuario WHERE Rol = 'Admin'") <= 1)
            return Ok(ApiResponse<string>.Error("No se puede eliminar al último administrador"));
        c.Execute("DELETE FROM Usuario WHERE IdUsuario = @id", new { id });
        return Ok(ApiResponse<string>.Ok("Usuario eliminado correctamente"));
    }
}
