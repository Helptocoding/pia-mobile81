namespace ProgramasFacpya.Api.Common;

public class ApiResponse<T>
{
    public bool Status { get; set; }
    public T? Value { get; set; }
    public string Msg { get; set; } = string.Empty;

    public static ApiResponse<T> Ok(T value, string msg = "") =>
        new() { Status = true, Value = value, Msg = msg };

    public static ApiResponse<T> Error(string msg) =>
        new() { Status = false, Value = default, Msg = msg };
}
