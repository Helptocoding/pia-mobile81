using System.Data;
using System.Text.RegularExpressions;
using Dapper;

namespace ProgramasFacpya.Api.Common;

public static class Validacion
{
    private static readonly Regex NombreRx = new(@"^\p{L}[\p{L} .'\-]*$", RegexOptions.Compiled);
    private static readonly Regex CorreoRx = new(@"^[^@\s]+@[^@\s]+\.[^@\s]{2,}$", RegexOptions.Compiled);
    private static readonly Regex TelefonoRx = new(@"^\d{10}$", RegexOptions.Compiled);

    public static string Limpiar(this string? s) => Regex.Replace((s ?? "").Trim(), @"\s+", " ");

    public static bool Existe(this IDbConnection c, string sql, object? p = null) =>
        c.ExecuteScalar<int>(sql, p) > 0;

    public static void Nombre(this List<string> e, string? v, string campo, int min = 2, int max = 50)
    {
        var t = v.Limpiar();
        if (t.Length == 0) e.Add($"{campo} es obligatorio");
        else if (t.Length < min) e.Add($"{campo} debe tener al menos {min} caracteres");
        else if (t.Length > max) e.Add($"{campo} no puede pasar de {max} caracteres");
        else if (!NombreRx.IsMatch(t)) e.Add($"{campo} solo admite letras");
    }

    public static void Correo(this List<string> e, string? v)
    {
        var t = (v ?? "").Trim();
        if (t.Length == 0) return;
        if (t.Length > 100 || !CorreoRx.IsMatch(t)) e.Add("El correo no tiene un formato válido");
    }

    public static void Telefono(this List<string> e, string? v)
    {
        var t = (v ?? "").Trim();
        if (t.Length == 0) return;
        if (!TelefonoRx.IsMatch(t)) e.Add("El teléfono debe tener 10 dígitos");
    }

    public static void FechaNacimiento(this List<string> e, DateOnly? v)
    {
        if (v is null) return;
        var hoy = DateOnly.FromDateTime(DateTime.Today);
        if (v > hoy) { e.Add("La fecha de nacimiento no puede ser futura"); return; }
        var edad = hoy.Year - v.Value.Year - (hoy < v.Value.AddYears(hoy.Year - v.Value.Year) ? 1 : 0);
        if (edad < 15) e.Add("El alumno debe tener al menos 15 años");
        else if (edad > 100) e.Add("La fecha de nacimiento no es válida");
    }

    public static string? Primero(this List<string> e) => e.Count == 0 ? null : string.Join("; ", e);

    public static void Password(this List<string> e, string? v, string campo = "La contraseña")
    {
        if (string.IsNullOrEmpty(v)) { e.Add($"{campo} es obligatoria"); return; }
        if (v.Length < 8) e.Add($"{campo} debe tener al menos 8 caracteres");
        else if (v.Length > 64) e.Add($"{campo} no puede pasar de 64 caracteres");
        else if (!v.Any(char.IsUpper) || !v.Any(char.IsLower) || !v.Any(char.IsDigit))
            e.Add($"{campo} debe incluir mayúscula, minúscula y número");
    }
}
