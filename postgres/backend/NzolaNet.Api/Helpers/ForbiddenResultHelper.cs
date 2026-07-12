using Microsoft.AspNetCore.Mvc;

namespace NzolaNet.Api.Helpers;

public static class ForbiddenResultHelper
{
    public static ObjectResult Create(string message = "Não tens permissão para aceder a este recurso.")
    {
        return new ObjectResult(new
        {
            statusCode = StatusCodes.Status403Forbidden,
            message
        })
        {
            StatusCode = StatusCodes.Status403Forbidden
        };
    }
}
