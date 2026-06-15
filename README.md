# NzolaNet

> Rede social desenvolvida para a cadeira de **Aplicações Web** — ISPTEC.
> **Grupo LODA** · Angular (Frontend) · ASP.NET Web API (Backend) · SQL Server (BD).

## 📄 Documentação do Projeto

Toda a documentação está disponível em **[https://kazenwilver.github.io/nzolanet/](https://kazenwilver.github.io/nzolanet/)** (após ativares o GitHub Pages em **Settings → Pages → Source: `main` / root**).

Localmente, podes abrir os seguintes ficheiros no browser:

- 🏠 **[index.html](./index.html)** — Página inicial com acesso aos dois planos
- 📘 **[Plano Definitivo Completo (HTML)](./extras/Plano/Plano_Definitivo_NzolaNet.html)** — projeto inteiro até ao Exame de Época Normal
- 📗 **[Plano da 2.ª Parcelar (HTML)](./extras/Plano/Plano_2_Parcelar_NzolaNet.html)** — foco na primeira entrega (Users + Posts + Comments)

Versões PDF e Markdown também disponíveis na pasta `extras/Plano/`.

## 🏛️ Arquitetura — porquê Camadas e não MVC

O enunciado **não pede MVC**; pede *"arquitetura de separação de camadas (Repositórios, Serviços, Controllers)"* + **DTOs**. Como a **View é o Angular** (SPA) e o backend é uma **Web API** que só devolve JSON, o MVC clássico (com Views no servidor) não se aplica. A estrutura adotada é:

- **Backend** em **camadas**: `Api` (Controllers) → `Application` (Services + DTOs) → `Domain` (Entities) + `Infrastructure` (EF Core, Repositórios, JWT, Storage).
- **Frontend** com **arquitetura modular Angular**: `core/`, `shared/`, `layouts/`, `features/`.

Ver detalhes na [Secção 2 do Plano da 2.ª Parcelar](./extras/Plano/Plano_2_Parcelar_NzolaNet.html).

## 🗂️ Estrutura do Repositório

```
NzolaNet/
├── index.html              ← Landing page (raiz para GitHub Pages)
├── README.md
├── .gitignore
├── backend/                ← ASP.NET Web API (esqueleto em camadas, ficheiros vazios)
│   ├── NzolaNet.sln
│   ├── NzolaNet.Api/               (Controllers, Middleware, Program.cs)
│   ├── NzolaNet.Application/       (Services, DTOs, Validators, Mappings, Exceptions)
│   ├── NzolaNet.Domain/           (Entities, Interfaces/Repositories)
│   └── NzolaNet.Infrastructure/   (EF Core, Repositories, JWT/Hash/Email/Storage)
├── frontend/               ← Angular (esqueleto modular, ficheiros vazios)
│   ├── proxy.conf.json
│   └── src/ (styles, environments, app/{core,shared,layouts,features})
├── docs/                   ← API_CONTRACT.md, database/ (schema + ERD), relatorio/
└── extras/                 ← Documentação
    ├── Enunciado/          ← Enunciado original do projeto
    ├── Plano/              ← Planos (Markdown + HTML + PDF)
    │   ├── Plano_Definitivo_NzolaNet.{md,html,pdf}
    │   └── Plano_2_Parcelar_NzolaNet.{md,html,pdf}
    └── build-pdf/          ← Scripts Node.js (geram HTML e PDF a partir dos .md)
```

> 📌 O esqueleto de `backend/` e `frontend/` contém **ficheiros vazios** (sem código), limitados ao **âmbito da 2.ª Parcelar**: Utilizadores, Publicações e Comentários (+ Autenticação e Seguir). Bazes, Notificações e Feed personalizado ficam para o Exame de Época Normal.

## 👥 Equipa — Grupo LODA

| Função | Membro | Stack |
|---|---|---|
| Backend | **Willfredy Vieira Dias** | ASP.NET Web API + SQL Server + EF Core |
| Frontend 1 | **Emer Tavares** | Angular — Autenticação + Perfil |
| Frontend 2 | **Jeovani Sassombo** | Angular — Publicações + Comentários |
| Frontend 3 | **Manuel Sulo** | Angular — Feed + Notificações + Design System |

## 🚀 Como regenerar a documentação

Sempre que alterares os Markdown dos planos:

```bash
cd extras/build-pdf
npm install      # primeira vez apenas
npm run build    # gera HTML + PDF de ambos os planos
# ou apenas o HTML:
npm run html
```

Os ficheiros saem em `extras/Plano/`.

## 📜 Licença

Projeto académico — ISPTEC 2026.

---

*Feito por **Willfredy Vieira Dias** — Nerd Altamente e Programador de Computadores 🤓✌️*
