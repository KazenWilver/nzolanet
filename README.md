# NzolaNet

> Rede social desenvolvida para a cadeira de **Aplicações Web** — ISPTEC.
> **Grupo LODA** · Angular (Frontend) · ASP.NET Web API (Backend) · SQL Server (BD).

## 📄 Documentação do Projeto

Toda a documentação está disponível em **[https://kazenwilver.github.io/nzolanet/](https://kazenwilver.github.io/nzolanet/)** (após ativares o GitHub Pages em **Settings → Pages → Source: `main` / root**).

Localmente, podes abrir os seguintes ficheiros no browser:

- 🏠 **[index.html](./index.html)** — Página inicial com acesso aos dois planos
- 📘 **[Plano Definitivo Completo (HTML)](./Plano/Plano_Definitivo_NzolaNet.html)** — projeto inteiro até ao Exame de Época Normal
- 📗 **[Plano da 2.ª Parcelar (HTML)](./Plano/Plano_2_Parcelar_NzolaNet.html)** — foco na primeira entrega (Users + Posts + Comments)
 
Versões PDF e Markdown também disponíveis na pasta `Plano/`.

## 🗂️ Estrutura do Repositório

```
NzolaNet/
├── index.html              ← Landing page (raiz para GitHub Pages)
├── README.md
├── .gitignore
├── Enunciado/              ← Enunciado original do projeto (PDF convertido)
├── Plano/                  ← Planos do projeto (Markdown + HTML + PDF)
│   ├── Plano_Definitivo_NzolaNet.{md,html,pdf}
│   └── Plano_2_Parcelar_NzolaNet.{md,html,pdf}
├── build-pdf/              ← Scripts Node.js que geram HTML e PDF a partir dos .md
│   ├── package.json
│   ├── build-html.mjs
│   └── build-pdf.mjs
├── backend/                ← (a criar) ASP.NET Web API
└── frontend/               ← (a criar) Angular
```

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
cd build-pdf
npm install      # primeira vez apenas
npm run build    # gera HTML + PDF de ambos os planos
```

Os ficheiros saem em `../Plano/`.

## 📜 Licença

Projeto académico — ISPTEC 2026.

---

*Feito por **Willfredy Vieira Dias** — Nerd Altamente e Programador de Computadores 🤓✌️*
