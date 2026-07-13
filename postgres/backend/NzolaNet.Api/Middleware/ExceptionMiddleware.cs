using System.Net;
using System.Text.Json;
using NzolaNet.Application.Exceptions;

namespace NzolaNet.Api.Middleware;

public class ExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionMiddleware> _logger;
    private readonly IHostEnvironment _env;

    public ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger, IHostEnvironment env)
    {
        _next = next;
        _logger = logger;
        _env = env;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Ocorreu uma exceção não tratada no pipeline da API.");
            await HandleExceptionAsync(context, ex);
        }
    }

    private Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";

        var statusCode = HttpStatusCode.InternalServerError;
        var message = "Ocorreu um erro interno no servidor.";

        switch (exception)
        {
            case ConflictException conflictEx:
                statusCode = HttpStatusCode.Conflict;
                message = conflictEx.Message;
                break;
            case InvalidCredentialsException invalidCredentialsEx:
                statusCode = HttpStatusCode.Unauthorized;
                message = invalidCredentialsEx.Message;
                break;
            case UnauthorizedAccessException unauthorizedEx:
                statusCode = HttpStatusCode.Forbidden;
                message = unauthorizedEx.Message;
                break;
            case KeyNotFoundException notFoundEx:
                statusCode = HttpStatusCode.NotFound;
                message = notFoundEx.Message;
                break;
            case ArgumentException argEx:
                if (argEx.Message.Contains("não encontrado", StringComparison.OrdinalIgnoreCase) ||
                    argEx.Message.Contains("não encontrada", StringComparison.OrdinalIgnoreCase))
                {
                    statusCode = HttpStatusCode.NotFound;
                }
                else
                {
                    statusCode = HttpStatusCode.BadRequest;
                }

                message = TranslateExceptionMessage(exception.Message);
                break;
            case InvalidOperationException invalidOpEx
                when invalidOpEx.Message.Contains("cannot be tracked", StringComparison.OrdinalIgnoreCase):
                statusCode = HttpStatusCode.BadRequest;
                message = "Ocorreu um conflito ao processar os dados. Tenta novamente.";
                break;
            case InvalidOperationException invalidOpEx:
                statusCode = HttpStatusCode.BadRequest;
                message = TranslateExceptionMessage(invalidOpEx.Message);
                break;
            default:
                if (_env.IsDevelopment())
                {
                    message = TranslateExceptionMessage(exception.Message);
                }

                break;
        }

        context.Response.StatusCode = (int)statusCode;

        var response = new
        {
            StatusCode = context.Response.StatusCode,
            Message = message,
            Details = _env.IsDevelopment() ? exception.StackTrace : null
        };

        var options = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
        var json = JsonSerializer.Serialize(response, options);

        return context.Response.WriteAsync(json);
    }

    private static string TranslateExceptionMessage(string message)
    {
        if (message.Contains("Passwords must have", StringComparison.OrdinalIgnoreCase))
        {
            return "A palavra-passe deve ter pelo menos 6 caracteres, incluindo maiúsculas, minúsculas e um dígito.";
        }

        if (message.Contains("Incorrect password", StringComparison.OrdinalIgnoreCase))
        {
            return "Palavra-passe actual incorrecta.";
        }

        if (message.Contains("cannot be tracked", StringComparison.OrdinalIgnoreCase))
        {
            return "Ocorreu um conflito ao processar os dados. Tenta novamente.";
        }

        return message;
    }
}
