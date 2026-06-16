using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using NzolaNet.Domain.Entities;
using NzolaNet.Infrastructure.Data;

var builder = WebApplication.CreateBuilder(args);

// 1. Configura a ligação à Base de Dados com EF Core e SQL Server
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
    ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(connectionString));

// 2. Configura o ASP.NET Core Identity para autenticação e gestão de utilizadores
builder.Services.AddIdentity<User, IdentityRole<Guid>>(options =>
{
    // Definições básicas de segurança da password
    options.Password.RequireDigit = true;
    options.Password.RequireLowercase = true;
    options.Password.RequireUppercase = true;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequiredLength = 6;
    
    // Configurações do utilizador
    options.User.RequireUniqueEmail = true;
})
.AddEntityFrameworkStores<ApplicationDbContext>()
.AddDefaultTokenProviders();

// 3. Adiciona os controladores da API
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Configura o pipeline de pedidos HTTP (Swagger)
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// Regra básica de pipeline: Autenticação ativa antes da Autorização
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
