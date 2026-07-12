<div align="center">

# NzolaNet

**Rede social académica e corporativa** — SPA Angular + REST API ASP.NET Core + SQL Server

[![Angular](https://img.shields.io/badge/Angular-20-DD0031?style=for-the-badge&logo=angular&logoColor=white)](https://angular.dev/)
[![ASP.NET Core](https://img.shields.io/badge/.NET-10-512BD4?style=for-the-badge&logo=dotnet&logoColor=white)](https://dotnet.microsoft.com/)
[![SQL Server](https://img.shields.io/badge/SQL_Server-Express-CC2927?style=for-the-badge&logo=microsoft-sql-server&logoColor=white)](https://www.microsoft.com/sql-server)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![SignalR](https://img.shields.io/badge/SignalR-tempo_real-0078D4?style=for-the-badge&logo=dotnet&logoColor=white)](https://dotnet.microsoft.com/apps/aspnet/signalr)
[![Playwright](https://img.shields.io/badge/E2E-22_testes-2EAD33?style=for-the-badge&logo=playwright&logoColor=white)](https://playwright.dev/)
[![WCAG](https://img.shields.io/badge/A11y-WCAG_2.1_AA-005A9C?style=for-the-badge)](https://www.w3.org/WAI/WCAG21/quickref/)

Desenvolvido pelo **Grupo LODA** · Cadeira de **Aplicações Web (AW)** · **ISPTEC**

[Funcionalidades](#funcionalidades) ·
[Arquitetura](#arquitetura) ·
[Instalação](#instalacao-e-execucao) ·
[Relatório PDF](#relatorio-academico) ·
[Testes](#testes) ·
[API](#api-rest) ·
[Equipa](#equipa)

</div>

---

## Índice

- [Sobre o projecto](#sobre-o-projecto)
- [Contexto académico](#contexto-academico)
- [Destaques](#destaques)
- [Stack tecnológica](#stack-tecnologica)
- [Arquitetura](#arquitetura)
- [Design e experiência](#design-e-experiencia)
- [Funcionalidades](#funcionalidades)
- [Fimbu — assistente de IA](#fimbu)
- [Mensagens e chat em tempo real](#mensagens)
- [Painel de administração](#administracao)
- [Fluxos principais](#fluxos-principais)
- [Layout responsivo](#layout-responsivo)
- [Segurança](#seguranca)
- [Estrutura do repositório](#estrutura-do-repositorio)
- [Base de dados](#base-de-dados)
- [API REST](#api-rest)
- [Instalação e execução](#instalacao-e-execucao)
- [Configuração](#configuracao)
- [Relatório académico (PDF)](#relatorio-academico)
- [Testes](#testes)
- [Limitações conhecidas](#limitacoes-conhecidas)
- [Equipa](#equipa)

---

<a id="sobre-o-projecto"></a>

## Sobre o projecto

O **NzolaNet** é uma plataforma de rede social inspirada em experiências modernas de microblogging, concebida para ambientes **académicos e corporativos**. Combina uma **Single Page Application (SPA)** em Angular com uma **Web API RESTful** em ASP.NET Core, persistência relacional em **SQL Server**, autenticação **stateless via JWT** e comunicação em tempo real com **SignalR**.

O objectivo é demonstrar boas práticas de engenharia de software: separação em camadas, API documentada, interface responsiva com acessibilidade, testes E2E automatizados, regras de privacidade semelhantes às de redes sociais reais e funcionalidades avançadas como **mensagens directas**, **assistente de IA (Fimbu)** e **painel administrativo** com moderação.

### Mapa de funcionalidades

```mermaid
mindmap
  root((NzolaNet))
    Autenticação
      Login / Registo
      JWT persistente
      Recuperação de senha
    Social
      Feed paginado
      Reposts
      Bookmarks
      Hashtags
      Denúncias
    Comunicação
      Mensagens 1:1
      Grupos
      Reacções
      SignalR
    IA
      Fimbu multi-provider
      Lexicon angolano
    Admin
      Indicadores
      Gráficos
      Moderação
      Código convite
```

---

<a id="contexto-academico"></a>

## Contexto académico

| Campo | Detalhe |
|-------|---------|
| **Instituição** | ISPTEC — Instituto Superior Politécnico de Tecnologias e Ciências |
| **Curso** | 3.º ano — Engenharia Informática |
| **Cadeira** | AW — Aplicações Web |
| **Docente** | Sediangani Sofrimento |
| **Projecto** | Rede social web com Angular, ASP.NET Web API e SQL Server |
| **Relatório** | PDF gerado automaticamente — ver [Relatório académico](#relatorio-academico) |

---

<a id="destaques"></a>

## Destaques

| Área | O que o NzolaNet oferece |
|------|--------------------------|
| **Autenticação** | Registo, login JWT, sessão persistente, alteração e recuperação de senha |
| **Publicações** | CRUD, imagem/vídeo, feed paginado, scroll infinito, reposts, hashtags |
| **Interacções** | Baze (like), comentários com media, bookmarks, denúncias, notificações |
| **Mensagens** | DM, grupos, media, reacções, editar/apagar, encaminhar — **SignalR** |
| **Fimbu** | Assistente de IA integrada, multi-provider, lexicon angolano |
| **Privacidade** | Perfis públicos/privados, pedidos de seguimento com aprovação |
| **Admin** | Painel `/admin` com indicadores, gráficos, moderação e código de convite |
| **UI/UX** | Tema Carbon Aurora, modo claro/escuro, animações GSAP, skeleton loading |
| **Mobile** | Bottom navigation, topbar no feed, safe-area, modais sheet |
| **Acessibilidade** | Focus trap, ARIA, navegação por teclado, alvos tácteis ≥ 44 px |
| **Segurança** | Uploads autenticados, media com regras de privacidade, CORS, roles Admin |
| **Qualidade** | 22 testes E2E Playwright (desktop + mobile viewport) |

---

<a id="stack-tecnologica"></a>

## Stack tecnológica

### Frontend

| Tecnologia | Uso |
|------------|-----|
| **Angular 20** | SPA standalone, lazy routes, signals-ready |
| **TypeScript** | Tipagem forte em serviços, modelos e componentes |
| **SCSS + CSS Variables** | Design tokens, temas, breakpoints |
| **GSAP** | Animações de entrada, modais, confetti no baze |
| **RxJS** | Streams reactivos nos serviços |
| **SignalR Client** | Chat e métricas admin em tempo real |
| **Chart.js** | Gráficos no painel administrativo |
| **Playwright** | Testes E2E desktop e mobile |

### Backend

| Tecnologia | Uso |
|------------|-----|
| **ASP.NET Core 10** | Web API, middleware, DI, SignalR hubs |
| **Entity Framework Core 8** | ORM, migrations, SQL Server |
| **ASP.NET Identity** | Utilizadores, roles, hash de senhas |
| **JWT Bearer** | Autenticação stateless (utilizador + admin) |
| **Swagger / OpenAPI** | Documentação interactiva da API |

### Infraestrutura

| Tecnologia | Uso |
|------------|-----|
| **SQL Server Express** | Base de dados relacional |
| **wwwroot/uploads** | Armazenamento de ficheiros (servidos via API autenticada) |
| **Providers IA** | OpenRouter, Google AI, Groq, NVIDIA (Fimbu) |

---

<a id="arquitetura"></a>

## Arquitetura

### Visão geral do sistema

```mermaid
flowchart TB
    subgraph Cliente["Cliente (Browser)"]
        SPA["Angular SPA<br/>localhost:4200"]
    end

    subgraph Proxy["Dev Proxy"]
        P["proxy.conf.json<br/>/api → :5000<br/>/uploads → :5000<br/>/hubs → :5000"]
    end

    subgraph API["Backend — Clean Architecture"]
        direction TB
        CTRL["NzolaNet.Api<br/>Controllers + Middleware + Hubs"]
        APP["NzolaNet.Application<br/>Services + DTOs + Fimbu"]
        INFRA["NzolaNet.Infrastructure<br/>EF Core + Repositories"]
        DOM["NzolaNet.Domain<br/>Entities + Interfaces"]
        CTRL --> APP --> INFRA --> DOM
    end

    subgraph Realtime["Tempo real"]
        H1["/hubs/chat"]
        H2["/hubs/admin"]
    end

    subgraph Dados["Persistência"]
        DB[(SQL Server<br/>NzolaNetDb)]
        FS["wwwroot/uploads/<br/>profiles · covers · publications · comments · messages"]
    end

    SPA --> P --> CTRL
    SPA <-.-> H1
    SPA <-.-> H2
    CTRL --> H1
    CTRL --> H2
    INFRA --> DB
    CTRL --> FS
```

### Camadas do backend

```mermaid
flowchart LR
    subgraph Api["NzolaNet.Api"]
        C[Controllers]
        M[Exception Middleware]
        S[Swagger]
        H[SignalR Hubs]
    end

    subgraph Application["NzolaNet.Application"]
        SV[Services]
        DTO[DTOs]
        IF[Interfaces]
        FIM[Fimbu Providers]
    end

    subgraph Infrastructure["NzolaNet.Infrastructure"]
        RP[Repositories]
        EF[ApplicationDbContext]
        JWT[JwtTokenService]
        ST[StorageService]
        EM[EmailService]
    end

    subgraph Domain["NzolaNet.Domain"]
        EN[Entities]
        RI[Repository Interfaces]
    end

    C --> SV
    SV --> RP
    RP --> EF
    SV --> IF
    RP --> RI
    RI --> EN
    H --> SV
```

| Camada | Responsabilidade |
|--------|------------------|
| **NzolaNet.Domain** | Entidades, contratos de repositório e regras de domínio |
| **NzolaNet.Application** | Regras de negócio, DTOs, serviços, providers Fimbu |
| **NzolaNet.Infrastructure** | EF Core, repositórios, Identity, JWT, email, armazenamento |
| **NzolaNet.Api** | Endpoints HTTP, hubs SignalR, CORS, autenticação, pipeline de erros |

### Frontend — organização

```mermaid
flowchart TB
    subgraph Core["core/"]
        SVC[Services]
        GUA[Guards]
        INT[Interceptors JWT]
        HEL[Helpers + i18n]
    end

    subgraph Features["features/"]
        AUTH[auth]
        FEED[feed]
        PROF[profile]
        NOTIF[notifications]
        MSG[messages]
        FIMB[fimbu]
        SRCH[search]
        SET[settings]
        ADM[admin]
    end

    subgraph Layout["layout/"]
        MAIN[main-layout]
        SIDE[sidebar]
        TOP[topbar]
        ASIDE[aside]
    end

    subgraph Shared["shared/"]
        COMP[components]
        DIR[directives]
        PIPE[pipes]
    end

    Core --> Features
    Layout --> Features
    Shared --> Features
```

### Rotas principais

| Área | Rotas |
|------|-------|
| **Auth (guest)** | `/login`, `/register`, `/forgot-password`, `/reset-password` |
| **App autenticada** | `/feed`, `/search`, `/notifications`, `/messages`, `/messages/:id`, `/fimbu`, `/bookmarks`, `/settings`, `/profile/me`, `/profile/:id`, `/publicacoes/:id` |
| **Admin** | `/admin/login`, `/admin/register`, `/admin` |
| **Aliases PT** | `/pesquisar` → `/search`, `/perfil/me` → `/profile/me`, `/notificacoes` → `/notifications` |

---

<a id="design-e-experiencia"></a>

## Design e experiência

### Tema visual — *Carbon Aurora & Glassmorphic Twilight*

| Token | Valor | Uso |
|-------|-------|-----|
| Canvas | `#07080A` | Fundo principal (modo escuro) |
| Superfícies | `#0F1011` | Cartões com blur e bordas translúcidas |
| Accent | `#7170FF` | Acções primárias, links activos |
| Engajamento | `#EC4899` | Baze, destaques de interacção |
| Tipografia | **Inter** | Corpo e interface |

- Modo **claro** e **escuro** com persistência em `localStorage`
- **Skeleton shimmer** durante carregamento do feed (com suporte a `prefers-reduced-motion`)
- **Transições de rota** animadas sem flash de conteúdo
- **Confetti** no baze (desactivado com animações reduzidas no SO)
- Interface em **português de Portugal** (`pt-PT`)

### Animações e micro-interacções

| Componente | Comportamento |
|------------|---------------|
| `AnimationService` | GSAP: enter, modal, likePop; durações mais curtas em mobile |
| `RouteTransitionService` | Fade/slide entre rotas; reset de scroll |
| `PressScaleDirective` | Feedback táctil em botões mobile |
| `ProfileParallaxDirective` | Parallax suave na capa do perfil |
| `EnterAnimationDirective` | Stagger de entrada nos cards do feed |

---

<a id="funcionalidades"></a>

## Funcionalidades

### Autenticação e conta

- [x] Registo com validação de email e username únicos
- [x] Login com JWT (Bearer) — duração configurável (7 dias por defeito)
- [x] Endpoint `/api/auth/me` para dados da sessão
- [x] Alteração de senha (utilizador autenticado)
- [x] Recuperação de senha — `forgot-password` + `reset-password` (email em dev via log)
- [x] Ecrã de boas-vindas `/welcome` com personalidade da Fimbu
- [x] Guards `authGuard` / `guestGuard` nas rotas

### Perfil e privacidade

- [x] Bio, foto de perfil, foto de capa
- [x] Perfil **público** ou **privado**
- [x] Seguir / deixar de seguir
- [x] Pedidos de seguimento com **aprovação** ou **rejeição**
- [x] Tabs: publicações, media, bazes, repartilhas
- [x] Perfil por username (`/profile/by-username/:username`)
- [x] Parallax na capa; avatar com fallback por inicial

### Publicações e feed

- [x] Criar publicação (texto, imagem e/ou vídeo — até 50 MB)
- [x] Editar e eliminar (apenas autor)
- [x] Feed **Para ti** (global com filtro de privacidade no SQL)
- [x] Feed **A seguir** (utilizadores seguidos + próprio)
- [x] Paginação com `hasMore` correcto para contas privadas
- [x] Scroll infinito com throttle
- [x] Página dedicada `/publicacoes/:id` com thread embedded
- [x] Resume de vídeo via query `?media=1&t=segundos`
- [x] **Reposts** com ou sem texto adicional (quote repost)
- [x] **Bookmarks** — guardar publicações em `/bookmarks`
- [x] **Hashtags** — trending e pesquisa por hashtag
- [x] **Denúncias** — reportar publicações e comentários

### Interacções

- [x] **Baze** (like) com toggle e contador
- [x] Notificação de baze removida ao fazer unlike
- [x] Comentários com texto, imagem ou vídeo
- [x] Notificações: baze, comentário, follow, pedido, aceite, recusado, repost, menção, mensagem
- [x] Badge de não lidas na navegação
- [x] Links no texto da publicação (linkificação segura)

### Pesquisa e descoberta

- [x] Pesquisa de utilizadores, publicações e hashtags (`/search`)
- [x] Sugestões **Quem seguir** (aside desktop ≥ 1280 px)
- [x] Painel de **tendências** com hashtags populares
- [x] Seguir directamente a partir dos resultados

### Definições

- [x] Secção **Conta** — dados pessoais editáveis
- [x] Secção **Privacidade** — perfil público ou privado
- [x] Secção **Palavra-passe** — alteração de senha

### Acessibilidade (a11y)

- [x] Focus trap com **stack** para overlays aninhados
- [x] Restore de foco ao fechar modais e menu da conta
- [x] Navegação por setas no menu da conta
- [x] ARIA em tabs, botões de acção e navegação mobile
- [x] Sem botões HTML aninhados
- [x] Contraste alinhado a WCAG 2.1 AA no tema escuro

---

<a id="fimbu"></a>

## Fimbu — assistente de IA

A **Fimbu** é a assistente de inteligência artificial integrada na NzolaNet, acessível em `/fimbu`.

```mermaid
flowchart LR
    U[Utilizador] --> SPA[Angular /fimbu]
    SPA --> API[POST /api/fimbu/chat]
    API --> P1[OpenRouter]
    API --> P2[Google AI]
    API --> P3[Groq]
    API --> P4[NVIDIA]
    P1 & P2 & P3 & P4 --> R[Resposta]
    R --> SPA
    API --> DB[(FimbuUserActivity)]
    API --> LEX[Lexicon angolano]
```

| Capacidade | Detalhe |
|------------|---------|
| **Histórico** | Conversas persistidas por utilizador |
| **Multi-provider** | Fallback automático entre fornecedores |
| **Lexicon** | Vocabulário angolano para respostas contextualizadas |
| **Personalidade** | Sorteada no registo/login |
| **Admin** | Contadores de actividade da Fimbu no painel |

**Endpoints:** `GET /api/fimbu/history` · `POST /api/fimbu/chat` · `DELETE /api/fimbu/history`

---

<a id="mensagens"></a>

## Mensagens e chat em tempo real

A secção **Mensagens** (`/messages`) está totalmente implementada — não é placeholder.

| Funcionalidade | Detalhe |
|----------------|---------|
| **Conversas directas** | Mensagens 1:1 entre utilizadores |
| **Grupos** | Criação de grupos com vários participantes |
| **Media** | Envio de imagens e ficheiros |
| **Reacções** | Emoji reactions nas mensagens |
| **Edição / eliminação** | Apagar para si ou para todos |
| **Encaminhar** | Forward de mensagens |
| **Tempo real** | SignalR hub `/hubs/chat` |
| **Notificações** | Badge unread + tipos `message`, `chat_mention`, `group_added` |

```mermaid
sequenceDiagram
    actor A as Utilizador A
    participant SPA as Angular
    participant Hub as /hubs/chat
    participant API as ConversationsController
    actor B as Utilizador B

    A->>SPA: Envia mensagem
    SPA->>API: POST /api/conversations/{id}/messages
    API->>Hub: Broadcast NewMessage
    Hub->>SPA: Evento em tempo real
    SPA->>B: Mensagem visível instantaneamente
```

---

<a id="administracao"></a>

## Painel de administração

O painel admin vive em **`/admin`** (login em `/admin/login`, registo em `/admin/register`).

### Código de convite de administrador

O registo de administradores é protegido por um **código de convite**. Sem o código correcto, a API rejeita o pedido com *«Código de administrador inválido»*.

| Origem | Valor |
|--------|-------|
| **Código por defeito** | `NZOLA-ADMIN-2026` |
| **Configuração** | `AdminSettings:RegistrationCode` em `appsettings.json` |
| **Override (produção)** | Variável de ambiente `NZOLANET_ADMIN_CODE` |

> O registo normal em `/register` **não** exige este código — apenas o registo admin.

### Funcionalidades do painel

| Secção | Descrição |
|--------|-----------|
| **Indicadores** | Métricas gerais da plataforma (utilizadores, publicações, actividade) |
| **Gráficos** | Visualização Chart.js com evolução temporal |
| **Moderação** | Publicações e comentários denunciados — remover ou dispensar |
| **Utilizadores** | Lista e gestão de contas |
| **Tempo real** | SignalR hub `/hubs/admin` para actualização de métricas |

```mermaid
flowchart TD
    R[Registo /admin/register] --> C{Código convite<br/>NZOLA-ADMIN-2026?}
    C -->|Inválido| E[401 — rejeitado]
    C -->|Válido| A[Conta Admin criada]
    A --> L[Login /admin/login]
    L --> D[Dashboard /admin]
    D --> M[Moderação de denúncias]
    D --> G[Gráficos e indicadores]
```

**Endpoints admin:** `POST /api/admin/login` · `POST /api/admin/register` · `GET /api/admin/metrics` · moderação de reports

---

<a id="fluxos-principais"></a>

## Fluxos principais

### Autenticação

```mermaid
sequenceDiagram
    actor U as Utilizador
    participant SPA as Angular SPA
    participant API as AuthController
    participant DB as SQL Server

    U->>SPA: Preenche login
    SPA->>API: POST /api/auth/login
    API->>DB: Valida credenciais (Identity)
    DB-->>API: Utilizador + roles
    API-->>SPA: JWT + dados do user
    SPA->>SPA: Guarda token (localStorage)
    SPA->>U: Redirect /feed

    Note over SPA,API: Pedidos seguintes incluem<br/>Authorization: Bearer {token}
```

### Seguimento de perfil privado

```mermaid
stateDiagram-v2
    [*] --> NaoSegue: Estado inicial
    NaoSegue --> PedidoPendente: Seguir (perfil privado)
    NaoSegue --> ASeguir: Seguir (perfil público)
    PedidoPendente --> ASeguir: Dono aprova
    PedidoPendente --> NaoSegue: Dono recusa
    ASeguir --> NaoSegue: Deixar de seguir
    ASeguir --> FeedVisivel: Posts do autor no feed
```

### Ciclo de vida de uma publicação

```mermaid
flowchart TD
    A[Criar publicação] --> B{Validação}
    B -->|Texto ou media| C[Upload opcional]
    C --> D[Persistir na BD]
    D --> E[Aparece no feed]
    E --> F{Interacções}
    F --> G[Baze + notificação]
    F --> H[Comentários]
    F --> I[Repost / Bookmark]
    F --> J[Denúncia]
    F --> K[Editar — autor]
    F --> L[Eliminar — autor]
    L --> M[Remove media + notificações]
```

### Servir ficheiros de upload

```mermaid
flowchart LR
    REQ["GET /uploads/..."] --> AUTH{JWT válido?}
    AUTH -->|Não| R401[401 Unauthorized]
    AUTH -->|Sim| PRIV{MediaAccessService<br/>regras de privacidade}
    PRIV -->|Negado| R404[404 Not Found]
    PRIV -->|Permitido| FILE[PhysicalFile<br/>com range para vídeo]
```

---

<a id="layout-responsivo"></a>

## Layout responsivo

```mermaid
flowchart TB
    subgraph Desktop["Desktop ≥ 1280px"]
        D1["Sidebar 275px"] --- D2["Centro 600px"] --- D3["Aside 350px"]
    end

    subgraph Tablet["Tablet 501–1279px"]
        T1["Sidebar 68px"] --- T2["Centro flex"]
    end

    subgraph Mobile["Mobile ≤ 500px"]
        M1["Centro 100%"]
        M2["Bottom nav fixa"]
        M3["Topbar só no /feed"]
    end
```

| Breakpoint | Comportamento |
|------------|---------------|
| `≤ 500px` | Bottom navigation (feed, search, fimbu, notificações, mensagens), modal sheet, safe-area insets |
| `≤ 988px` | Sidebar colapsada (ícones) |
| `≤ 1279px` | Aside (Quem seguir) oculto — pesquisa via `/search` |
| `≥ 1280px` | Layout completo em 3 colunas |

---

<a id="seguranca"></a>

## Segurança

| Medida | Implementação |
|--------|---------------|
| **Autenticação** | JWT Bearer; chave via `NZOLANET_JWT_KEY` ou `JwtSettings:Key` |
| **Autorização** | Roles `User` / `Admin`; guards no frontend |
| **Admin isolado** | Sessão JWT separada para o painel admin |
| **Código convite** | Registo admin exige `AdminSettings:RegistrationCode` |
| **Uploads** | Sem `UseStaticFiles` público; `UploadsController` + `MediaAccessService` |
| **Media privada** | Posts/comentários de perfis privados só para seguidores aprovados |
| **CORS** | Política `AllowAngular`; origens configuráveis |
| **Senhas** | ASP.NET Identity com requisitos mínimos |
| **Erros** | `ExceptionMiddleware` global — respostas consistentes |
| **Path traversal** | Validação em paths de upload (`..` rejeitado) |
| **Denúncias** | Fluxo de moderação admin para conteúdo reportado |

---

<a id="estrutura-do-repositorio"></a>

## Estrutura do repositório

```
NzolaNet/
├── backend/
│   ├── NzolaNet.Api/              # Controllers, Hubs, Program.cs, Swagger
│   ├── NzolaNet.Application/      # Services, DTOs, Fimbu providers
│   ├── NzolaNet.Domain/           # Entidades, contratos
│   └── NzolaNet.Infrastructure/   # EF Core, repos, Identity, JWT, email
├── frontend/
│   ├── src/app/
│   │   ├── core/                  # Services, guards, interceptors, i18n
│   │   ├── features/              # Páginas por domínio
│   │   ├── layout/                # Shell, sidebar, topbar
│   │   └── shared/                # Componentes reutilizáveis
│   ├── e2e/                       # Playwright (desktop + mobile)
│   ├── scripts/
│   │   ├── run-e2e.js             # Orquestrador E2E
│   │   └── generate-report.mjs    # Relatório PDF académico
│   ├── mock-backend.js            # Mock para E2E
│   └── proxy.conf.json            # Proxy dev → API :5000
├── docs/
│   ├── database/                  # schema.sql, erd.md
│   ├── relatorio-nzolanet.pdf     # Relatório (gerado localmente)
│   ├── relatorio-nzolanet.html    # Versão HTML do relatório
│   └── report-assets/             # 27 screenshots do relatório
├── palavras_angolanas/            # Lexicon da Fimbu
├── postgres/                      # Variante cloud: Postgres + Render + Vercel (ver postgres/README.md)
└── README.md
```

> **Nota:** Pastas locais como `extras/` (enunciado, referências) e `.cursor/` estão no `.gitignore` e não fazem parte do repositório remoto.

> **Hospedagem gratuita:** a pasta [`postgres/`](./postgres/README.md) é uma cópia independente com **PostgreSQL (Npgsql)** para deploy em Supabase + Render + Vercel. A raiz deste repo continua em **SQL Server** e não é alterada por essa variante.

---

<a id="base-de-dados"></a>

## Base de dados

O esquema relacional inclui utilizadores (Identity), publicações, comentários, likes, seguimentos, notificações, **mensagens**, **reposts**, **bookmarks**, **denúncias** e **actividade Fimbu**.

Documentação SQL (tabelas base):

- [`docs/database/schema.sql`](docs/database/schema.sql) — DDL SQL Server
- [`docs/database/erd.md`](docs/database/erd.md) — diagrama entidade-relacionamento

```mermaid
erDiagram
    AspNetUsers ||--o{ Posts : publishes
    AspNetUsers ||--o{ Comments : writes
    AspNetUsers ||--o{ Likes : performs
    AspNetUsers ||--o{ Follows : follows
    AspNetUsers ||--o{ Notifications : receives
    AspNetUsers ||--o{ Conversations : participates
    AspNetUsers ||--o{ Messages : sends
    AspNetUsers ||--o{ Reposts : reposts
    AspNetUsers ||--o{ Bookmarks : bookmarks
    AspNetUsers ||--o{ ContentReports : reports
    Posts ||--o{ Comments : has
    Posts ||--o{ Likes : receives
    Posts ||--o{ Notifications : triggers
    Conversations ||--o{ Messages : contains
    Conversations ||--o{ ConversationParticipants : has
```

| Entidade | Descrição |
|----------|-----------|
| `Conversation` / `ConversationParticipant` | Conversas directas e de grupo |
| `Message` / `MessageReaction` | Mensagens, reacções e ocultação |
| `Repost` | Repartilhas de publicações |
| `Bookmark` | Publicações guardadas |
| `ContentReport` | Denúncias de publicações/comentários |
| `PlatformCounter` / `FimbuUserActivity` | Métricas admin e actividade IA |

As **migrations** EF Core são aplicadas automaticamente no arranque da API.

---

<a id="api-rest"></a>

## API REST

Base URL em desenvolvimento: `http://localhost:5000`

| Grupo | Prefixo | Exemplos |
|-------|---------|----------|
| Autenticação | `/api/auth` | `login`, `register`, `me`, `change-password`, `forgot-password`, `reset-password` |
| Utilizadores | `/api/users` | `search`, `suggestions`, `{id}/follow`, `follow-requests`, `me/bookmarks` |
| Publicações | `/api/publications` | `feed`, CRUD, `{id}/like`, `{id}/repost`, `{id}/bookmark`, `{id}/report`, `trending-hashtags` |
| Comentários | `/api/comments` | CRUD, `{id}/report` |
| Notificações | `/api/notifications` | listar, marcar lidas, unread-count, eliminar |
| Conversas | `/api/conversations` | CRUD, grupos, mensagens, media, reacções, forward, read |
| Fimbu | `/api/fimbu` | `history`, `chat`, `DELETE history` |
| Uploads | `/uploads` | `GET /uploads/{path}` *(autenticado)* |
| Admin | `/api/admin` | `login`, `register`, `metrics`, moderação, utilizadores |
| SignalR | `/hubs/chat`, `/hubs/admin` | tempo real chat + métricas admin |

**Swagger UI:** `http://localhost:5000/swagger` *(ambiente Development)*

O frontend usa `environment.apiUrl: '/api'` com proxy em desenvolvimento (`proxy.conf.json`).

---

<a id="instalacao-e-execucao"></a>

## Instalação e execução

### Pré-requisitos

| Ferramenta | Versão mínima |
|------------|---------------|
| [.NET SDK](https://dotnet.microsoft.com/download) | 10.x |
| [Node.js LTS](https://nodejs.org/) | 20.x |
| SQL Server Express ou LocalDB | Qualquer edição recente |
| Git | Qualquer |

### 1. Clonar o repositório

```bash
git clone <url-do-repositorio>
cd NzolaNet
```

### 2. Configurar variáveis de ambiente (backend)

```powershell
# PowerShell — obrigatório para JWT
$env:NZOLANET_JWT_KEY="sua-chave-secreta-com-pelo-menos-32-caracteres"

# Opcional — override do código de convite admin
$env:NZOLANET_ADMIN_CODE="NZOLA-ADMIN-2026"

# Opcional — chaves dos providers Fimbu
$env:NZOLANET_FIMBU_OPENROUTER_KEY="sua-chave"
```

```bash
# Bash / macOS / Linux
export NZOLANET_JWT_KEY="sua-chave-secreta-com-pelo-menos-32-caracteres"
export NZOLANET_ADMIN_CODE="NZOLA-ADMIN-2026"
```

Copie `backend/NzolaNet.Api/appsettings.Development.example.json` para `appsettings.Development.json` e preencha JWT, Fimbu e `SeedAdmin` (conta admin inicial).

Ajuste a connection string em `backend/NzolaNet.Api/appsettings.json` se o seu SQL Server não for `.\SQLEXPRESS`.

### 3. Executar o backend

```bash
cd backend/NzolaNet.Api
dotnet restore
dotnet run
```

| Serviço | URL |
|---------|-----|
| API | http://localhost:5000 |
| Swagger | http://localhost:5000/swagger |

### 4. Executar o frontend

Num **segundo terminal**:

```bash
cd frontend
npm install
npm start
```

| Serviço | URL |
|---------|-----|
| Angular SPA | http://localhost:4200 |
| Login | http://localhost:4200/login |
| Admin | http://localhost:4200/admin/login |

O proxy encaminha `/api`, `/uploads` e `/hubs` para a API em `:5000`.

### Scripts úteis (frontend)

| Comando | Descrição |
|---------|-----------|
| `npm start` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run e2e` | 22 testes E2E (mock backend + Angular + Playwright) |
| `npm run start:lan` | Servidor acessível na rede local |
| `npm run start:ngrok` | Configuração para túnel ngrok |

---

<a id="configuracao"></a>

## Configuração

### `appsettings.json` (backend)

| Secção | Descrição |
|--------|-----------|
| `ConnectionStrings:DefaultConnection` | Ligação SQL Server |
| `JwtSettings` | Issuer, Audience, duração do token |
| `AdminSettings:RegistrationCode` | Código de convite admin (`NZOLA-ADMIN-2026`) |
| `Fimbu` | Chaves e modelos dos providers IA |
| `Frontend:BaseUrl` | URL da SPA (links de email) |
| `CorsOrigins` | Origens permitidas em produção |

### `appsettings.Development.json` (local, gitignored)

| Secção | Descrição |
|--------|-----------|
| `SeedAdmin` | Conta administrador inicial (email, username, password) |
| `AppSettings:ExposePasswordResetLink` | Expõe link de reset no log (dev) |
| `Fimbu:*` | Chaves API preenchidas para testes locais |

### Variáveis de ambiente

| Variável | Descrição |
|----------|-----------|
| `NZOLANET_JWT_KEY` | Chave secreta JWT (obrigatória) |
| `NZOLANET_ADMIN_CODE` | Override do código de convite admin |
| `NZOLANET_FIMBU_OPENROUTER_KEY` | Chave OpenRouter |
| `NZOLANET_FIMBU_GOOGLE_AI_KEY` | Chave Google AI |
| `NZOLANET_FIMBU_GROQ_KEY` | Chave Groq |
| `NZOLANET_FIMBU_NVIDIA_KEY` | Chave NVIDIA |

### `environment.ts` (frontend)

| Propriedade | Dev | Produção |
|-------------|-----|----------|
| `apiUrl` | `/api` (proxy) | URL absoluta da API |
| `uploadsUrl` | `''` (proxy) | URL base dos uploads |
| `chatHubUrl` | `/hubs/chat` | URL do hub SignalR |
| `adminHubUrl` | `/hubs/admin` | URL do hub admin |

Ficheiros sensíveis ignorados pelo Git: `appsettings.Development.json`, `environment.ngrok.ts`, `*.env`.

---

<a id="relatorio-academico"></a>

## Relatório académico (PDF)

O projecto inclui um gerador automático de relatório em português de Portugal, com capa, índice, tabelas e **27 capturas de ecrã**.

### Gerar o relatório

```bash
# Requer backend (:5000) e frontend (:4200) activos
cd frontend
node scripts/generate-report.mjs --capture
```

| Flag | Descrição |
|------|-----------|
| `--capture` | Captura screenshots e gera PDF |
| `--skip-capture` | Reutiliza imagens existentes, só regera PDF |
| `--resume-capture` | Salta screenshots que já existem |
| `--admin-only` | Captura apenas ecrãs admin (03, 04, 25–27) |

### Saída

| Ficheiro | Conteúdo |
|----------|----------|
| `docs/relatorio-nzolanet.pdf` | Relatório completo para entrega |
| `docs/relatorio-nzolanet.html` | Versão HTML |
| `docs/report-assets/*.png` | 27 screenshots numeradas |

### Capturas incluídas

| # | Ecrã |
|---|------|
| 1–2 | Login e registo da NzolaNet |
| 3–4 | Login e registo admin |
| 5–24 | Feed, pesquisa, mensagens, Fimbu, perfil, definições, modo escuro |
| 25–27 | Painel admin — indicadores, gráficos, moderação |

---

<a id="testes"></a>

## Testes

### Testes automatizados E2E (Playwright)

```bash
cd frontend
npm run e2e
```

| Projecto | Ficheiro | Testes |
|----------|----------|--------|
| `desktop-chromium` | `e2e/nzolanet.spec.ts` | 13 |
| `mobile-chromium` | `e2e/nzolanet.mobile.spec.ts` | 9 |
| **Total** | | **22** |

O script `run-e2e.js` inicia automaticamente o mock backend, compila o Angular, instala Chromium e executa a suite.

**Cobertura E2E:** tema, login, feed, criar publicação, pesquisa, perfil, notificações, mensagens, rotas, auth inválida, registo, recuperação de senha, baze, bottom nav mobile, topbar, modal publicar, overflow horizontal.

### Testes manuais recomendados

Antes da entrega ou demonstração, validar manualmente:

1. **Privacidade** — duas contas; perfil privado; pedido → aprovação → feed visível
2. **Uploads** — imagem num post; URL sem token → 401; com sessão → visível
3. **Unlike** — baze → notificação; unlike → notificação removida
4. **Mensagens** — DM, grupo, reacções, tempo real com duas sessões
5. **Fimbu** — conversa, histórico, resposta multi-provider
6. **Admin** — login, moderação de denúncia, gráficos
7. **Mobile** — viewport ≤ 500 px; bottom nav; modal sheet; sem scroll horizontal
8. **Tema** — alternar claro/escuro; persistência após F5
9. **A11y** — Tab no modal; Escape fecha; menu conta com setas

### Testes contra API real

Os E2E usam `mock-backend.js`. Para validar integração completa, execute backend + frontend e percorra os fluxos acima com a API .NET activa.

---

<a id="limitacoes-conhecidas"></a>

## Limitações conhecidas

| Item | Estado |
|------|--------|
| Email de recuperação de senha | Funcional em dev (log); requer SMTP configurado em produção |
| E2E mobile | Chromium emulado (Pixel 7); não substitui teste em Safari/iOS real |
| Schema SQL em `docs/database/` | Documenta tabelas base; entidades novas reflectidas nas migrations EF |
| `extras/` | Materiais de referência locais — não versionados no GitHub |
| Relatório PDF | Gerado localmente; requer servidores activos para capturas |

---

<a id="equipa"></a>

## Equipa

**Grupo LODA** — ISPTEC · Aplicações Web · Docente: Sediangani Sofrimento

| Membro | N.º | Área de contribuição |
|--------|-----|----------------------|
| **Willfredy Vieira Dias** | 20200204 | Backend — ASP.NET Core Web API, SQL Server, segurança |
| **Manuel Sulo** | 20221465 | Frontend — feed, notificações, design system, animações |
| **Jeovani Sassombo** | 20220737 | Frontend — publicações, comentários, interacções |
| **Emer Tavares** | 20220633 | Frontend — autenticação, perfil, experiência do utilizador |

---

<div align="center">

**NzolaNet** — *May The Code Be With You*

Desenvolvido com foco em boas práticas de engenharia de software, acessibilidade e experiência responsiva.

</div>
