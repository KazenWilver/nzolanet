# NzolaNet API — imagem para Render / Docker
# Build context: pasta postgres/ (não backend/)
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY backend/NzolaNet.Domain/NzolaNet.Domain.csproj backend/NzolaNet.Domain/
COPY backend/NzolaNet.Application/NzolaNet.Application.csproj backend/NzolaNet.Application/
COPY backend/NzolaNet.Infrastructure/NzolaNet.Infrastructure.csproj backend/NzolaNet.Infrastructure/
COPY backend/NzolaNet.Api/NzolaNet.Api.csproj backend/NzolaNet.Api/
COPY palavras_angolanas/ palavras_angolanas/

RUN dotnet restore backend/NzolaNet.Api/NzolaNet.Api.csproj

COPY backend/ backend/
COPY palavras_angolanas/ palavras_angolanas/

RUN dotnet publish backend/NzolaNet.Api/NzolaNet.Api.csproj -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
ENV ASPNETCORE_ENVIRONMENT=Production
EXPOSE 8080
ENTRYPOINT ["dotnet", "NzolaNet.Api.dll"]
