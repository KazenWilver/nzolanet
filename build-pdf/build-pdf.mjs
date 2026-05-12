// Gerador de PDFs dos planos NzolaNet
// Fluxo: Markdown -> HTML estilizado para impressao -> PDF (Microsoft Edge headless)

import { readFileSync, writeFileSync, existsSync, unlinkSync } from "node:fs";
import { resolve, dirname, basename } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";

import { Marked } from "marked";
import { gfmHeadingId } from "marked-gfm-heading-id";
import hljs from "highlight.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PROJECT_ROOT = resolve(__dirname, "..");
const PLANO_DIR = resolve(PROJECT_ROOT, "Plano");

const TARGETS = [
  {
    key: "completo",
    inputMd: resolve(PLANO_DIR, "Plano_Definitivo_NzolaNet.md"),
    outputPdf: resolve(PLANO_DIR, "Plano_Definitivo_NzolaNet.pdf"),
    coverBadge: "Projecto AW · ISPTEC",
    coverTitle: "NzolaNet",
    coverSubtitle: "Plano Definitivo e Estrutural do Sistema",
    chips1: ["Angular (Frontend)", "ASP.NET Web API (Backend)", "SQL Server (Base de Dados)"],
    chips2: ["Arquitetura em Camadas", "DTOs Bidirecionais", "JWT + Clean Code"],
    coverFooter: "Objetivo: 20 / 20 · Epoca Normal",
  },
  {
    key: "parcelar",
    inputMd: resolve(PLANO_DIR, "Plano_2_Parcelar_NzolaNet.md"),
    outputPdf: resolve(PLANO_DIR, "Plano_2_Parcelar_NzolaNet.pdf"),
    coverBadge: "Projecto AW · 2.ª Parcelar",
    coverTitle: "2.ª Parcelar",
    coverSubtitle: "Gestão de Utilizadores · Publicações · Comentários",
    chips1: ["Foco em 3 dominios", "4 Semanas", "Setup Completo"],
    chips2: ["JWT + EF Core", "CRUD + Upload", "Repository + Service"],
    coverFooter: "Foco: primeira entrega da NzolaNet (4 semanas)",
  },
];

const EDGE_PATHS = [
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
];

function findEdge() {
  for (const p of EDGE_PATHS) if (existsSync(p)) return p;
  throw new Error("Microsoft Edge nao foi encontrado no sistema.");
}

// ---- Slug helpers ---------------------------------------------------------

function baseSlug(text) {
  let s = text.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, "")
    .trim().replace(/\s+/g, "-");
  return s || "sec";
}

function normalizeAnchorLinks(md) {
  return md.replace(/(\]\([^)#\s]*)#([^)\s"]+)/g, (_m, before, anchor) => {
    return `${before}#${baseSlug(anchor)}`;
  });
}

// ---- Marked ---------------------------------------------------------------

function buildMarked() {
  const slugUsed = new Map();
  function slugify(text) {
    const base = baseSlug(text);
    const count = slugUsed.get(base) ?? 0;
    slugUsed.set(base, count + 1);
    return count === 0 ? base : `${base}-${count}`;
  }

  const marked = new Marked({ gfm: true, breaks: false });
  marked.use(gfmHeadingId({ prefix: "" }));
  marked.use({
    renderer: {
      heading(token) {
        const text = this.parser.parseInline(token.tokens);
        const id = slugify(token.text);
        return `<h${token.depth} id="${id}">${text}</h${token.depth}>\n`;
      },
      code(token) {
        const lang = (token.lang || "").trim();
        const raw = token.text;
        let highlighted;
        try {
          highlighted = lang && hljs.getLanguage(lang)
            ? hljs.highlight(raw, { language: lang, ignoreIllegals: true }).value
            : hljs.highlightAuto(raw).value;
        } catch {
          highlighted = raw.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        }
        const langLabel = lang ? `<span class="code-lang">${lang}</span>` : "";
        return `<pre class="hljs"><code class="hljs language-${lang}">${langLabel}${highlighted}</code></pre>`;
      },
    },
  });
  return marked;
}

// ---- CSS (otimizado para impressao A4) ------------------------------------

const CSS = String.raw`
:root {
  --c-text: #1f2937;
  --c-muted: #6b7280;
  --c-heading: #0f172a;
  --c-accent: #2563eb;
  --c-accent-soft: #dbeafe;
  --c-border: #e5e7eb;
  --c-border-strong: #cbd5e1;
  --c-bg: #ffffff;
  --c-bg-soft: #f8fafc;
  --c-code-bg: #0f172a;
  --c-code-text: #e2e8f0;
  --c-table-head: #1e293b;
}

@page {
  size: A4;
  margin: 18mm 16mm 22mm 16mm;
  @bottom-center {
    content: "NzolaNet  -  Pagina " counter(page) " de " counter(pages);
    color: #94a3b8;
    font-size: 9pt;
    font-family: "Segoe UI", system-ui, sans-serif;
  }
}

* { box-sizing: border-box; }

html, body {
  margin: 0; padding: 0; background: var(--c-bg); color: var(--c-text);
  font-family: "Segoe UI", "Helvetica Neue", Arial, system-ui, sans-serif;
  font-size: 10.5pt; line-height: 1.6;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

.cover {
  height: 250mm;
  display: flex; flex-direction: column;
  justify-content: center; align-items: center;
  text-align: center; padding: 30mm 20mm;
  background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 60%, #2563eb 100%);
  color: #f8fafc; page-break-after: always; position: relative;
}
.cover .badge {
  display: inline-block;
  padding: 6px 14px;
  border: 1px solid rgba(255,255,255,.4);
  border-radius: 999px;
  font-size: 9pt; letter-spacing: 2px; text-transform: uppercase;
  margin-bottom: 28px; color: #cbd5e1;
}
.cover h1 {
  font-size: 40pt; margin: 0 0 12px 0; font-weight: 800;
  letter-spacing: -1px; color: #ffffff;
  border: none; padding: 0;
}
.cover h2 {
  font-size: 16pt; margin: 0 0 32px 0; font-weight: 400;
  color: #cbd5e1; border: none; padding: 0;
}
.cover .stack { display: flex; gap: 12px; flex-wrap: wrap; justify-content: center; margin: 18px 0; }
.cover .chip {
  background: rgba(255,255,255,.08);
  border: 1px solid rgba(255,255,255,.25);
  border-radius: 8px; padding: 8px 14px;
  font-size: 10pt; color: #e2e8f0;
}
.cover .author {
  margin-top: 40px; padding: 20px 26px;
  border: 1px solid rgba(255,255,255,.25);
  border-radius: 12px; background: rgba(15,23,42,.35);
  min-width: 60%;
}
.cover .author .label {
  font-size: 9pt; text-transform: uppercase; letter-spacing: 2px;
  color: #94a3b8; margin-bottom: 6px;
}
.cover .author .name { font-size: 18pt; font-weight: 700; color: #ffffff; margin-bottom: 4px; }
.cover .author .role { font-size: 11pt; color: #cbd5e1; margin-bottom: 8px; }
.cover .author .slogan { font-size: 10.5pt; font-style: italic; color: #93c5fd; }
.cover .cover-footer {
  position: absolute; bottom: 18mm;
  font-size: 9pt; color: #94a3b8; letter-spacing: 1px;
}

.content { padding: 0 4mm; }

/* Esconder o cabecalho duplicado do markdown */
.content > h1:first-of-type,
.content > h1:first-of-type + blockquote,
.content > h1:first-of-type + blockquote + hr,
.content > h1:first-of-type + blockquote + hr + blockquote,
.content > h1:first-of-type + blockquote + hr + blockquote + hr,
.content > h1:first-of-type + blockquote + hr + blockquote + hr + blockquote { display: none; }

h1, h2, h3, h4, h5, h6 { color: var(--c-heading); font-weight: 700; line-height: 1.25; margin: 1.6em 0 0.6em 0; }
h1 { font-size: 22pt; border-bottom: 3px solid var(--c-accent); padding-bottom: 0.3em; margin-top: 0; page-break-before: always; }
.content > h1:first-of-type { page-break-before: avoid; }
h2 { font-size: 16pt; border-bottom: 1px solid var(--c-border); padding-bottom: 0.25em; }
h3 { font-size: 13pt; color: var(--c-accent); }
h4 { font-size: 11.5pt; color: #334155; }
h5 { font-size: 10.5pt; color: #475569; text-transform: uppercase; letter-spacing: 1px; }

p { margin: 0.6em 0; }
a { color: var(--c-accent); text-decoration: none; }
strong { color: var(--c-heading); }
em { color: #475569; }

ul, ol { margin: 0.6em 0 0.8em 0; padding-left: 1.6em; }
li { margin: 0.2em 0; }
li::marker { color: var(--c-accent); }

blockquote {
  margin: 1em 0; padding: 0.6em 1em;
  border-left: 4px solid var(--c-accent);
  background: var(--c-accent-soft);
  color: #1e3a8a;
  border-radius: 0 8px 8px 0;
}
blockquote p { margin: 0.3em 0; }

:not(pre) > code {
  background: #f1f5f9; color: #be185d;
  padding: 1px 6px; border-radius: 4px;
  font-family: "Cascadia Code", "Consolas", "Courier New", monospace;
  font-size: 0.92em;
  border: 1px solid #e2e8f0;
}

pre.hljs {
  background: var(--c-code-bg); color: var(--c-code-text);
  padding: 14px 16px 14px 16px; padding-top: 30px;
  border-radius: 10px; overflow-x: auto;
  font-size: 8.8pt; line-height: 1.5; position: relative;
  margin: 1em 0;
  border: 1px solid #1e293b;
  page-break-inside: avoid;
}
pre.hljs code { font-family: "Cascadia Code", "Consolas", "Courier New", monospace; background: transparent; color: inherit; padding: 0; border: none; }
pre.hljs .code-lang {
  position: absolute; top: 8px; right: 12px;
  font-size: 8pt; letter-spacing: 1.5px; text-transform: uppercase;
  color: #94a3b8; font-family: "Segoe UI", sans-serif;
}

.hljs-comment, .hljs-quote { color: #94a3b8; font-style: italic; }
.hljs-keyword, .hljs-selector-tag, .hljs-built_in, .hljs-name, .hljs-tag { color: #c084fc; }
.hljs-string, .hljs-doctag, .hljs-template-tag, .hljs-template-variable { color: #86efac; }
.hljs-title, .hljs-section, .hljs-selector-id, .hljs-title.class_, .hljs-title.function_ { color: #fde68a; }
.hljs-number, .hljs-literal, .hljs-symbol, .hljs-attr { color: #fda4af; }
.hljs-type, .hljs-class .hljs-title { color: #67e8f9; }
.hljs-attribute, .hljs-variable, .hljs-meta { color: #93c5fd; }
.hljs-emphasis { font-style: italic; }
.hljs-strong { font-weight: 700; }

table {
  width: 100%; border-collapse: collapse;
  margin: 1em 0; font-size: 9.8pt;
  page-break-inside: avoid;
  border: 1px solid var(--c-border-strong);
  border-radius: 8px; overflow: hidden;
}
thead { background: var(--c-table-head); }
thead th { color: #ffffff; text-align: left; padding: 8px 12px; font-weight: 600; font-size: 9.5pt; border-bottom: 2px solid #0f172a; }
tbody td { padding: 7px 12px; border-top: 1px solid var(--c-border); vertical-align: top; }
tbody tr:nth-child(even) { background: var(--c-bg-soft); }

hr { border: none; height: 1px; background: var(--c-border); margin: 1.8em 0; }
img { max-width: 100%; height: auto; border-radius: 6px; }

h1, h2, h3, h4, h5, h6 { page-break-after: avoid; }
p, li { orphans: 3; widows: 3; }
table, pre { page-break-inside: avoid; }
`;

// ---- Build de um target ---------------------------------------------------

function buildOne(target) {
  let md = readFileSync(target.inputMd, "utf8");
  md = normalizeAnchorLinks(md);
  const marked = buildMarked();
  const bodyHtml = marked.parse(md);

  const chips1 = target.chips1.map(c => `<span class="chip">${c}</span>`).join("");
  const chips2 = target.chips2.map(c => `<span class="chip">${c}</span>`).join("");

  const coverHtml = `
<section class="cover">
  <span class="badge">${target.coverBadge}</span>
  <h1>${target.coverTitle}</h1>
  <h2>${target.coverSubtitle}</h2>
  <div class="stack">${chips1}</div>
  <div class="stack">${chips2}</div>
  <div class="author">
    <div class="label">Feito por</div>
    <div class="name">Willfredy Vieira Dias</div>
    <div class="role">Backend com ASP.NET Web API</div>
    <div class="slogan">"Nerd Altamente e Programador de Computadores 🤓✌️"</div>
  </div>
  <div class="cover-footer">${target.coverFooter}</div>
</section>
`;

  const html = `<!doctype html>
<html lang="pt-pt">
<head>
<meta charset="utf-8">
<title>${target.coverTitle} - NzolaNet</title>
<style>${CSS}</style>
</head>
<body>
${coverHtml}
<main class="content">
${bodyHtml}
</main>
</body>
</html>`;

  const htmlTemp = resolve(__dirname, `__tmp_${target.key}.html`);
  writeFileSync(htmlTemp, html, "utf8");

  const edge = findEdge();
  const htmlUrl = pathToFileURL(htmlTemp).href;

  const args = [
    "--headless=new",
    "--disable-gpu",
    "--no-pdf-header-footer",
    "--no-sandbox",
    "--disable-extensions",
    "--no-default-browser-check",
    `--print-to-pdf=${target.outputPdf}`,
    htmlUrl,
  ];

  const result = spawnSync(edge, args, { stdio: "pipe" });

  // limpar HTML temporario
  try { unlinkSync(htmlTemp); } catch {}

  if (result.status !== 0) {
    throw new Error(`Edge falhou para ${target.key} (codigo: ${result.status})`);
  }

  console.log(`  ✓ ${basename(target.outputPdf)}`);
}

// ---- Run ------------------------------------------------------------------

console.log("Gerando PDFs com Microsoft Edge headless...\n");
for (const target of TARGETS) {
  try { buildOne(target); }
  catch (e) { console.error(`  ✗ ${target.key}: ${e.message}`); process.exit(1); }
}
console.log("\nConcluido. PDFs em:", PLANO_DIR);
