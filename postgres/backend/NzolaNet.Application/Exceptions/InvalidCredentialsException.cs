namespace NzolaNet.Application.Exceptions;

/// <summary>
/// Represents invalid authentication credentials.
/// </summary>
public class InvalidCredentialsException : Exception
{
    public InvalidCredentialsException(string message = "Credenciais inválidas.") : base(message)
    {
    }
}
