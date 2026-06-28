namespace NzolaNet.Application.Exceptions;

/// <summary>
/// Represents a business rule conflict such as a duplicate resource.
/// </summary>
public class ConflictException : Exception
{
    public ConflictException(string message) : base(message)
    {
    }
}
