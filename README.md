# NzolaNet

> Rede social desenvolvida para a cadeira de **Aplicações Web** — ISPTEC.
> **Grupo LODA** · Angular (Frontend) · ASP.NET Web API (Backend) · SQL Server (BD).

## 📄 Documentação do Projeto

Toda a documentação está disponível em **[https://<teu-utilizador>.github.io/nzolanet/](#)** (substitui pelo teu link depois de ativar GitHub Pages).

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

## 👥 Equipa

| Função | Membro | Stack |
|---|---|---|
| Backend | **Willfredy Vieira Dias** | ASP.NET Web API + SQL Server + EF Core |
| Frontend 1 | FE-Dev 1 | Angular — Autenticação + Perfil |
| Frontend 2 | FE-Dev 2 | Angular — Publicações + Comentários |
| Frontend 3 | FE-Dev 3 | Angular — Feed + Notificações + Design System |

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
