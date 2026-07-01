using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc.ApiExplorer;
using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace NzolaNet.Api.Swagger;

/// <summary>
/// Corrige a geração Swagger para endpoints multipart com IFormFile.
/// </summary>
public sealed class SwaggerFormFileOperationFilter : IOperationFilter
{
    public void Apply(OpenApiOperation operation, OperationFilterContext context)
    {
        var formParameters = context.ApiDescription.ParameterDescriptions
            .Where(parameter => parameter.Source == Microsoft.AspNetCore.Mvc.ModelBinding.BindingSource.Form)
            .ToList();

        if (formParameters.Count == 0)
        {
            return;
        }

        var properties = new Dictionary<string, OpenApiSchema>();

        foreach (var parameter in formParameters)
        {
            var modelType = parameter.ModelMetadata?.ModelType;
            if (modelType is null)
            {
                continue;
            }

            properties[parameter.Name] = IsFormFileType(modelType)
                ? new OpenApiSchema { Type = "string", Format = "binary" }
                : new OpenApiSchema { Type = "string" };
        }

        if (properties.Count == 0)
        {
            return;
        }

        operation.RequestBody = new OpenApiRequestBody
        {
            Required = true,
            Content = new Dictionary<string, OpenApiMediaType>
            {
                ["multipart/form-data"] = new OpenApiMediaType
                {
                    Schema = new OpenApiSchema
                    {
                        Type = "object",
                        Properties = properties
                    }
                }
            }
        };

        var formParameterNames = formParameters
            .Select(parameter => parameter.Name)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        operation.Parameters = operation.Parameters
            .Where(parameter => !formParameterNames.Contains(parameter.Name))
            .ToList();
    }

    private static bool IsFormFileType(Type modelType)
    {
        return modelType == typeof(IFormFile)
            || modelType == typeof(IFormFile[])
            || modelType == typeof(IEnumerable<IFormFile>);
    }
}
