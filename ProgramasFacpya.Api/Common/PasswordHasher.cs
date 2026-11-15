using System.Security.Cryptography;

namespace ProgramasFacpya.Api.Common;

/// <summary>PBKDF2-SHA256. Formato guardado: iteraciones.salt.hash (base64).</summary>
public static class PasswordHasher
{
    private const int Iteraciones = 100_000;

    public static string Hash(string password)
    {
        var salt = RandomNumberGenerator.GetBytes(16);
        var hash = Rfc2898DeriveBytes.Pbkdf2(password, salt, Iteraciones, HashAlgorithmName.SHA256, 32);
        return $"{Iteraciones}.{Convert.ToBase64String(salt)}.{Convert.ToBase64String(hash)}";
    }

    public static bool Verificar(string password, string guardado)
    {
        var p = guardado.Split('.');
        if (p.Length != 3 || !int.TryParse(p[0], out var it)) return false;
        var salt = Convert.FromBase64String(p[1]);
        var esperado = Convert.FromBase64String(p[2]);
        var hash = Rfc2898DeriveBytes.Pbkdf2(password, salt, it, HashAlgorithmName.SHA256, esperado.Length);
        return CryptographicOperations.FixedTimeEquals(hash, esperado);
    }
}
