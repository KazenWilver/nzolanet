using System.IdentityModel.Tokens.Jwt;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using NzolaNet.Domain.Entities;
using NzolaNet.Domain.Interfaces.Repositories;
using NzolaNet.Application.Interfaces;
using NzolaNet.Application.Services;
using NzolaNet.Infrastructure.Data;
using NzolaNet.Infrastructure.Identity;
using NzolaNet.Infrastructure.Repositories;
using NzolaNet.Infrastructure.Services;
using NzolaNet.Api.Middleware;
using NzolaNet.Api.Hubs;
using NzolaNet.Api.Services;
using NzolaNet.Api.Swagger;
using NzolaNet.Application.Options;
using NzolaNet.Application.Services.Fimbu;

var builder = WebApplication.CreateBuilder(args);

const long maxUploadBytes = 52_428_800; // 50 MB

builder.WebHost.ConfigureKestrel(options =>
{
    options.Limits.MaxRequestBodySize = maxUploadBytes;
});

builder.Services.Configure<FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = maxUploadBytes;
});

// 1. Configura a ligação à Base de Dados com EF Core e SQL Server
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
    ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(connectionString));

// 2. Configura o ASP.NET Core Identity para autenticação e gestão de utilizadores
builder.Services.AddIdentity<User, IdentityRole<Guid>>(options =>
{
    options.Password.RequireDigit = true;
    options.Password.RequireLowercase = true;
    options.Password.RequireUppercase = true;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequiredLength = 6;
    options.User.RequireUniqueEmail = true;
})
.AddEntityFrameworkStores<ApplicationDbContext>()
.AddErrorDescriber<PortugueseIdentityErrorDescriber>()
.AddDefaultTokenProviders();

// 3. Configura a Autenticação JWT (Token Bearer)
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var jwtKey = Environment.GetEnvironmentVariable("NZOLANET_JWT_KEY")
    ?? jwtSettings["Key"];

if (string.IsNullOrWhiteSpace(jwtKey))
{
    throw new InvalidOperationException(
        "JWT signing key em falta. Copia appsettings.Development.example.json para appsettings.Development.json ou define NZOLANET_JWT_KEY.");
}

var key = Encoding.UTF8.GetBytes(jwtKey);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.MapInboundClaims = false;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(key),
        NameClaimType = JwtRegisteredClaimNames.Sub,
        RoleClaimType = "role",
        ClockSkew = TimeSpan.Zero
    };

    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];
            var path = context.HttpContext.Request.Path;

            if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
            {
                context.Token = accessToken;
            }

            return Task.CompletedTask;
        }
    };
});

// 4. Registo de Repositórios e Serviços (Injeção de Dependências)
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IFollowRepository, FollowRepository>();
builder.Services.AddScoped<IPostRepository, PostRepository>();
builder.Services.AddScoped<ICommentRepository, CommentRepository>();
builder.Services.AddScoped<ILikeRepository, LikeRepository>();
builder.Services.AddScoped<INotificationRepository, NotificationRepository>();
builder.Services.AddScoped<IConversationRepository, ConversationRepository>();
builder.Services.AddScoped<IMessageReactionRepository, MessageReactionRepository>();
builder.Services.AddScoped<IRepostRepository, RepostRepository>();
builder.Services.AddScoped<IBookmarkRepository, BookmarkRepository>();
builder.Services.AddScoped<IContentReportRepository, ContentReportRepository>();
builder.Services.AddScoped<IPlatformCounterRepository, PlatformCounterRepository>();
builder.Services.AddScoped<IFimbuActivityRepository, FimbuActivityRepository>();

builder.Services.AddScoped<IStorageService, StorageService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<IJwtTokenService, JwtTokenService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<PostService>();
builder.Services.AddScoped<IPostService, PostService>();
builder.Services.AddScoped<IBookmarkService, BookmarkService>();
builder.Services.AddScoped<ICommentService, CommentService>();
builder.Services.AddScoped<ILikeService, LikeService>();
builder.Services.AddScoped<IRepostService, RepostService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<IConversationService, ConversationService>();
builder.Services.AddScoped<IMediaAccessService, MediaAccessService>();
builder.Services.AddScoped<IReportService, ReportService>();
builder.Services.AddScoped<IAdminService, AdminService>();

// 4.1. Fimbu — vincula a secção inteira do appsettings de uma vez (apanha
// automaticamente qualquer propriedade nova de FimbuSettings, sem precisar de
// a copiar manualmente aqui), e só depois sobrepõe as chaves de API vindas de
// variáveis de ambiente com PostConfigure. Isto evita o bug de propriedades
// configuradas em appsettings.json serem silenciosamente ignoradas por não
// terem sido incluídas numa lista de cópia manual.
builder.Services.Configure<FimbuSettings>(
    builder.Configuration.GetSection(FimbuSettings.SectionName));

builder.Services.PostConfigure<FimbuSettings>(options =>
{
    options.OpenRouterApiKey = ResolveSecret("NZOLANET_FIMBU_OPENROUTER_KEY", options.OpenRouterApiKey);
    options.GoogleAiApiKey = ResolveSecret("NZOLANET_FIMBU_GOOGLE_AI_KEY", options.GoogleAiApiKey);
    options.GroqApiKey = ResolveSecret("NZOLANET_FIMBU_GROQ_KEY", options.GroqApiKey);
    options.NvidiaApiKey = ResolveSecret("NZOLANET_FIMBU_NVIDIA_KEY", options.NvidiaApiKey);
});

builder.Services.AddHttpClient("FimbuLlm", (sp, client) =>
{
    var fimbuOptions = sp.GetRequiredService<IOptions<FimbuSettings>>().Value;
    client.Timeout = TimeSpan.FromSeconds(Math.Max(30, fimbuOptions.RequestTimeoutSeconds));
});
builder.Services.AddSingleton<IFimbuLexiconService, FimbuLexiconService>();
builder.Services.AddSingleton<IFimbuMoodService, FimbuMoodService>();
builder.Services.AddSingleton<IFimbuChatService, FimbuChatService>();

builder.Services.AddSignalR();
builder.Services.AddSingleton<IUserPresenceService, UserPresenceService>();
builder.Services.AddSingleton<IChatRealtimeNotifier, SignalRChatRealtimeNotifier>();

// 4.5. Configura a política de CORS para o frontend Angular
var corsOrigins = builder.Configuration.GetSection("CorsOrigins").Get<string[]>()
    ?? new[] { "http://localhost:4200" };

var extraCorsOrigins = builder.Configuration["CORS_EXTRA_ORIGINS"];
if (!string.IsNullOrWhiteSpace(extraCorsOrigins))
{
    corsOrigins = corsOrigins
        .Concat(extraCorsOrigins.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
        .Distinct(StringComparer.OrdinalIgnoreCase)
        .ToArray();
}

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngular", policy =>
    {
        policy.AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();

        if (builder.Environment.IsDevelopment())
        {
            policy.SetIsOriginAllowed(IsAllowedDevelopmentOrigin);
        }
        else
        {
            policy.WithOrigins(corsOrigins);
        }
    });
});

static bool IsAllowedDevelopmentOrigin(string origin)
{
    if (!Uri.TryCreate(origin, UriKind.Absolute, out var uri))
    {
        return false;
    }

    if (uri.Host is "localhost" or "127.0.0.1")
    {
        return uri.Scheme is "http" or "https";
    }

    return uri.Scheme == "https"
        && (uri.Host.EndsWith(".ngrok-free.dev", StringComparison.OrdinalIgnoreCase)
            || uri.Host.EndsWith(".ngrok-free.app", StringComparison.OrdinalIgnoreCase)
            || uri.Host.EndsWith(".ngrok.app", StringComparison.OrdinalIgnoreCase));
}

// 5. Adiciona os controladores da API
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// 6. Configura o Swagger para suportar cabeçalhos de Autorização Bearer Token
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "NzolaNet API", Version = "v1" });
    c.MapType<IFormFile>(() => new OpenApiSchema
    {
        Type = "string",
        Format = "binary"
    });
    c.OperationFilter<SwaggerFormFileOperationFilter>();
    
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "Autenticação JWT usando o esquema Bearer. Exemplo: 'Bearer 12345abcdef'",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// Diagnóstico de arranque da Fimbu — lido directamente do container de DI
// (já com appsettings + variáveis de ambiente combinados), em vez de repetir
// a lógica de resolução de segredos aqui.
var fimbuOptions = app.Services.GetRequiredService<IOptions<FimbuSettings>>().Value;
var configuredFimbuProviders = new[]
{
    string.IsNullOrWhiteSpace(fimbuOptions.OpenRouterApiKey) ? null : "OpenRouter",
    string.IsNullOrWhiteSpace(fimbuOptions.GoogleAiApiKey) ? null : "Google AI Studio",
    string.IsNullOrWhiteSpace(fimbuOptions.GroqApiKey) ? null : "Groq",
    string.IsNullOrWhiteSpace(fimbuOptions.NvidiaApiKey) ? null : "NVIDIA"
}.Count(provider => provider is not null);

if (configuredFimbuProviders == 0)
{
    Console.WriteLine("AVISO Fimbu: nenhuma chave API configurada. Preenche a secção Fimbu em appsettings.Development.json ou define NZOLANET_FIMBU_*.");
}
else
{
    Console.WriteLine($"Fimbu: {configuredFimbuProviders} fornecedor(es) API configurado(s).");
}

var webRoot = app.Environment.WebRootPath ?? Path.Combine(app.Environment.ContentRootPath, "wwwroot");
Directory.CreateDirectory(Path.Combine(webRoot, "uploads", "profiles"));
Directory.CreateDirectory(Path.Combine(webRoot, "uploads", "covers"));
Directory.CreateDirectory(Path.Combine(webRoot, "uploads", "publications"));
Directory.CreateDirectory(Path.Combine(webRoot, "uploads", "comments"));
Directory.CreateDirectory(Path.Combine(webRoot, "uploads", "messages"));
Directory.CreateDirectory(Path.Combine(webRoot, "messages"));

// Migrate database on startup
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<ApplicationDbContext>();
        context.Database.Migrate();
        await DbSeeder.SeedAsync(services);
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "Ocorreu um erro ao aplicar as migrações da base de dados.");
    }
}

// Regista o Middleware de Tratamento de Erros Global
app.UseMiddleware<ExceptionMiddleware>();

// Configura o pipeline de pedidos HTTP (Swagger)
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// Habilita a política de CORS
app.UseCors("AllowAngular");

// Uploads servidos via UploadsController com autenticação e verificação de privacidade

// Regra básica de pipeline: Autenticação ativa antes da Autorização
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<ChatHub>("/hubs/chat");

app.Run();

static string ResolveSecret(string environmentVariableName, string? configuredValue)
{
    var fromEnvironment = Environment.GetEnvironmentVariable(environmentVariableName);
    return string.IsNullOrWhiteSpace(fromEnvironment) ? (configuredValue ?? string.Empty) : fromEnvironment;
}