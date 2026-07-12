# NzolaNet — variante PostgreSQL (Supabase + Render + Vercel)

Esta pasta é uma **cópia independente** do NzolaNet para hospedagem gratuita.
O projecto original na raiz do repositório (**SQL Server**) mantém-se intacto.

```
Utilizadores
    │
    ▼
Angular  →  Vercel
    │
    ▼
API ASP.NET Core + SignalR  →  Render
    │
    ▼
PostgreSQL  →  Supabase
```

## O que mudou vs. a raiz do repo

| Área | Original | Esta pasta |
|------|----------|------------|
| Base de dados | SQL Server | PostgreSQL (Npgsql) |
| Migrations EF | SQL Server | Regeneradas para Postgres |
| Deploy | Local | Dockerfile + envs cloud |
| Frontend prod | `api.nzolanet.ao` | Placeholder Render |

## Pré-requisitos locais

- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- [Node.js 20+](https://nodejs.org/)
- PostgreSQL local **ou** projecto [Supabase](https://supabase.com/) (connection string)

## 1. Base de dados (Supabase)

1. Cria um projecto em [supabase.com](https://supabase.com/).
2. Em **Project Settings → Database**, copia a connection string **URI** (modo Session ou Transaction — para a API .NET usa a connection string com `Host=...`).
3. Formato típico Npgsql:

```text
Host=db.XXXX.supabase.co;Port=5432;Database=postgres;Username=postgres;Password=YOUR_PASSWORD;SSL Mode=Require;Trust Server Certificate=true
```

4. Coloca-a em:
   - local: `backend/NzolaNet.Api/appsettings.Development.json` → `ConnectionStrings:DefaultConnection`
   - Render: variável de ambiente `ConnectionStrings__DefaultConnection`

No arranque, a API aplica `Database.Migrate()` e o seed automaticamente.

## 2. API no Render

1. Conta em [render.com](https://render.com/).
2. **New → Web Service**, liga o repositório GitHub.
3. Definições:
   - **Root Directory:** `postgres` (esta pasta)
   - **Runtime:** Docker
   - **Dockerfile Path:** `./Dockerfile`
4. Variáveis de ambiente (mínimo):

| Variável | Exemplo |
|----------|---------|
| `ConnectionStrings__DefaultConnection` | connection string Supabase |
| `NZOLANET_JWT_KEY` | chave longa (≥32 chars) |
| `CORS_EXTRA_ORIGINS` | `https://teu-projecto.vercel.app` |
| `Frontend__BaseUrl` | `https://teu-projecto.vercel.app` |
| `AdminSettings__RegistrationCode` | código de admin |
| `ASPNETCORE_ENVIRONMENT` | `Production` |

Opcionais Fimbu: `NZOLANET_FIMBU_OPENROUTER_API_KEY`, etc. (ver API original).

5. Depois do deploy, testa: `https://TEU-SERVICO.onrender.com/health`

> **Uploads:** no disco do Render free os ficheiros em `wwwroot/uploads` **não são persistentes** entre redeploys. Para produção real convém object storage (Supabase Storage / Cloudflare R2). Para demo académica costuma bastar.

### Keep-alive (evitar hibernação free)

No free tier o Render dorme ~15 min sem tráfego. Com utilizadores activos **não dorme**.

Para manter acordado (opcional):

1. [UptimeRobot](https://uptimerobot.com/) ou [cron-job.org](https://cron-job.org/)
2. Monitor HTTP cada 5–10 min para `https://TEU-SERVICO.onrender.com/health`

## 3. Frontend no Vercel

1. Em `frontend/src/environments/environment.prod.ts`, substitui `YOUR-RENDER-API` pela URL real do Render.
2. Conta em [vercel.com](https://vercel.com/).
3. Importa o repo; configura:
   - **Root Directory:** `postgres/frontend`
   - **Build Command:** `npm ci && npx ng build --configuration=production`
   - **Output Directory:** `dist/frontend/browser` (confirma após o primeiro build local)
4. Deploy.

Confirma o output path com:

```bash
cd postgres/frontend
npm ci
npx ng build --configuration=production
```

## 4. Desenvolvimento local

```powershell
# 1. Copiar secrets de exemplo
Copy-Item backend\NzolaNet.Api\appsettings.Development.example.json `
          backend\NzolaNet.Api\appsettings.Development.json

# 2. Editar ConnectionStrings + JWT no Development.json

# 3. API
cd backend\NzolaNet.Api
dotnet run

# 4. Angular (outro terminal)
cd frontend
npm install
npm start
```

## Voltar ao SQL Server

Usa a árvore na **raiz** do repositório (`backend/`, `frontend/`). Esta pasta `postgres/` é independente.

## Estrutura

```
postgres/
├── Dockerfile
├── README.md                 ← este ficheiro
├── palavras_angolanas/
├── backend/                  ← ASP.NET Core + Npgsql
├── frontend/                 ← Angular (environments de prod para Render)
└── docs/
```
