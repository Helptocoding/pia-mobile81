using Dapper;
using Microsoft.Data.Sqlite;
using ProgramasFacpya.Api.Common;

namespace ProgramasFacpya.Api.Data;

public class Db(IConfiguration config)
{
    private readonly string _cs = config.GetConnectionString("DefaultConnection")!;

    public const string Ahora = "strftime('%Y-%m-%dT%H:%M:%SZ','now')";

    public SqliteConnection Crear()
    {
        var c = new SqliteConnection(_cs);
        c.Open();
        c.Execute("PRAGMA foreign_keys = ON;");
        return c;
    }

    public void Inicializar()
    {
        using var c = Crear();
        c.Execute("""
            CREATE TABLE IF NOT EXISTS Usuario (
                IdUsuario     INTEGER PRIMARY KEY AUTOINCREMENT,
                NombreUsuario TEXT NOT NULL UNIQUE COLLATE NOCASE,
                PasswordHash  TEXT NOT NULL,
                Rol           TEXT NOT NULL CHECK (Rol IN ('Admin','Capturista','Consulta')),
                FecRegistro   TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS Carrera (
                IdCarrera   INTEGER PRIMARY KEY AUTOINCREMENT,
                Descripcion TEXT NOT NULL UNIQUE COLLATE NOCASE
            );
            CREATE TABLE IF NOT EXISTS Maestro (
                IdMaestro    INTEGER PRIMARY KEY AUTOINCREMENT,
                Nombre       TEXT NOT NULL,
                APaterno     TEXT NOT NULL,
                AMaterno     TEXT NOT NULL,
                Correo       TEXT UNIQUE COLLATE NOCASE,
                Telefono     TEXT,
                Especialidad TEXT,
                FecRegistro  TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS Alumno (
                IdAlumno        INTEGER PRIMARY KEY AUTOINCREMENT,
                Matricula       TEXT UNIQUE,
                Nombre          TEXT NOT NULL,
                APaterno        TEXT NOT NULL,
                AMaterno        TEXT NOT NULL,
                IdCarrera       INTEGER NOT NULL REFERENCES Carrera(IdCarrera),
                Correo          TEXT UNIQUE COLLATE NOCASE,
                Telefono        TEXT,
                FechaNacimiento TEXT,
                FecRegistro     TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS Materia (
                IdMateria INTEGER PRIMARY KEY AUTOINCREMENT,
                Clave     TEXT NOT NULL UNIQUE COLLATE NOCASE,
                Nombre    TEXT NOT NULL UNIQUE COLLATE NOCASE,
                Creditos  INTEGER NOT NULL CHECK (Creditos BETWEEN 1 AND 12),
                IdMaestro INTEGER REFERENCES Maestro(IdMaestro)
            );
            CREATE TABLE IF NOT EXISTS Inscripcion (
                IdInscripcion  INTEGER PRIMARY KEY AUTOINCREMENT,
                IdAlumno       INTEGER NOT NULL REFERENCES Alumno(IdAlumno) ON DELETE CASCADE,
                IdMateria      INTEGER NOT NULL REFERENCES Materia(IdMateria),
                Calificacion   REAL CHECK (Calificacion IS NULL OR Calificacion BETWEEN 0 AND 100),
                FecInscripcion TEXT NOT NULL,
                UNIQUE (IdAlumno, IdMateria)
            );
            """);

        if (c.ExecuteScalar<int>("SELECT COUNT(*) FROM Usuario") == 0)
        {
            SembrarUsuario(c, "admin", "Admin123!", "Admin");
            SembrarUsuario(c, "capturista", "Captura123!", "Capturista");
            SembrarUsuario(c, "consulta", "Consulta123!", "Consulta");
        }

        if (c.ExecuteScalar<int>("SELECT COUNT(*) FROM Carrera") == 0)
        {
            c.Execute($"""
                INSERT INTO Carrera (Descripcion) VALUES
                  ('Ingeniería en Sistemas'), ('Contaduría Pública'), ('Administración');
                INSERT INTO Maestro (Nombre, APaterno, AMaterno, Correo, Telefono, Especialidad, FecRegistro) VALUES
                  ('Laura', 'Gómez', 'Ruiz', 'laura.gomez@facpya.mx', '8112345678', 'Programación', {Ahora}),
                  ('Carlos', 'Hernández', 'Soto', 'carlos.hernandez@facpya.mx', '8187654321', 'Finanzas', {Ahora});
                INSERT INTO Alumno (Matricula, Nombre, APaterno, AMaterno, IdCarrera, Correo, Telefono, FechaNacimiento, FecRegistro) VALUES
                  ('2026-00001', 'Ana', 'López', 'Pérez', 1, 'ana.lopez@alumnos.mx', '8111111111', '2004-05-12', {Ahora}),
                  ('2026-00002', 'Luis', 'Martínez', 'Díaz', 2, 'luis.martinez@alumnos.mx', '8122222222', '2003-09-30', {Ahora});
                INSERT INTO Materia (Clave, Nombre, Creditos, IdMaestro) VALUES
                  ('PROG101', 'Programación I', 8, 1),
                  ('CONT101', 'Contabilidad Básica', 6, 2);
                INSERT INTO Inscripcion (IdAlumno, IdMateria, Calificacion, FecInscripcion) VALUES
                  (1, 1, 92, {Ahora}),
                  (2, 2, NULL, {Ahora});
                """);
        }
    }

    private static void SembrarUsuario(SqliteConnection c, string usuario, string password, string rol) =>
        c.Execute($"INSERT INTO Usuario (NombreUsuario, PasswordHash, Rol, FecRegistro) VALUES (@usuario, @hash, @rol, {Ahora})",
            new { usuario, hash = PasswordHasher.Hash(password), rol });
}
