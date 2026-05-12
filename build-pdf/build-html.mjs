// Gerador de pagina HTML interativa para os planos NzolaNet
// Output: Plano/*.html (single-file, sem CDNs)
// Suporta multiplos planos com navegacao entre eles.

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";

import { Marked } from "marked";
import { gfmHeadingId } from "marked-gfm-heading-id";
import hljs from "highlight.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, "..");
const PLANO_DIR = resolve(PROJECT_ROOT, "Plano");

// ---- Configuracao dos planos ----------------------------------------------

const TARGETS = [
  {
    key: "completo",
    inputMd: resolve(PLANO_DIR, "Plano_Definitivo_NzolaNet.md"),
    outputHtml: resolve(PLANO_DIR, "Plano_Definitivo_NzolaNet.html"),
    pdfFile: "Plano_Definitivo_NzolaNet.pdf",
    title: "Plano Definitivo",
    titleHtml: "NzolaNet",
    subtitle: "Plano Definitivo e Estrutural · Visão End-to-End para 20 / 20",
    badge: "Projecto AW · Plano Completo",
    chips1: ["Angular (Frontend)", "ASP.NET Web API (Backend)", "SQL Server"],
    chips2: ["Arquitetura em Camadas", "DTOs Bidirecionais", "JWT · Clean Code"],
    coverFooter: "Objetivo: 20 / 20 · 2.ª Parcelar e Exame de Época Normal",
    nav: {
      currentLabel: "Plano Completo",
      otherFile: "Plano_2_Parcelar_NzolaNet.html",
      otherLabel: "2.ª Parcelar",
    },
  },
  {
    key: "parcelar",
    inputMd: resolve(PLANO_DIR, "Plano_2_Parcelar_NzolaNet.md"),
    outputHtml: resolve(PLANO_DIR, "Plano_2_Parcelar_NzolaNet.html"),
    pdfFile: "Plano_2_Parcelar_NzolaNet.pdf",
    title: "2.ª Parcelar",
    titleHtml: "2.ª Parcelar",
    subtitle: "Gestão de Utilizadores · Publicações · Comentários — Caminho directo para 20 / 20",
    badge: "Projecto AW · Entrega Intermédia",
    chips1: ["Gestão de Utilizadores", "Gestão de Publicações", "Gestão de Comentários"],
    chips2: ["4 Semanas", "JWT + EF Core", "Setup Completo"],
    coverFooter: "Foco: 1.ª entrega da NzolaNet (4 semanas)",
    nav: {
      currentLabel: "2.ª Parcelar",
      otherFile: "Plano_Definitivo_NzolaNet.html",
      otherLabel: "Plano Completo",
    },
  },
];

// ---- Marked + renderer customizado ----------------------------------------

function buildMarked(headings, slugUsed) {
  function slugify(text) {
    let base = text.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s-]/g, "")
      .trim().replace(/\s+/g, "-");
    if (!base) base = "sec";
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
        const raw = token.text;
        const id = slugify(raw);
        const level = token.depth;
        if (level <= 3) headings.push({ level, text: raw, id });
        return `<h${level} id="${id}"><a class="heading-anchor" href="#${id}" aria-hidden="true">#</a>${text}</h${level}>\n`;
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
          highlighted = raw
            .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        }
        const langLabel = `<span class="code-lang">${lang || "text"}</span>`;
        const rawEsc = raw
          .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;");
        return `<div class="code-block">
${langLabel}
<button class="code-copy" type="button" data-code="${rawEsc}" aria-label="Copiar codigo">Copiar</button>
<pre class="hljs"><code class="hljs language-${lang}">${highlighted}</code></pre>
</div>`;
      },
      table(token) {
        const header = token.header.map(cell =>
          `<th${cell.align ? ` style="text-align:${cell.align}"` : ""}>${this.parser.parseInline(cell.tokens)}</th>`
        ).join("");
        const body = token.rows.map(row =>
          `<tr>${row.map(cell => `<td${cell.align ? ` style="text-align:${cell.align}"` : ""}>${this.parser.parseInline(cell.tokens)}</td>`).join("")}</tr>`
        ).join("\n");
        return `<div class="table-wrap"><table><thead><tr>${header}</tr></thead><tbody>${body}</tbody></table></div>`;
      },
    },
  });

  return marked;
}

// ---- TOC ------------------------------------------------------------------

function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function buildToc(items) {
  if (!items.length) return "";
  let html = `<ol class="toc-list">`;
  let openH3 = false;
  let firstItem = true;

  for (const h of items) {
    if (h.level === 2) {
      if (openH3) { html += "</ol></li>"; openH3 = false; }
      else if (!firstItem) html += "</li>";
      html += `<li><a href="#${h.id}" class="toc-link toc-l2" data-target="${h.id}">${escapeHtml(h.text)}</a>`;
      firstItem = false;
    } else if (h.level === 3) {
      if (!openH3) { html += `<ol class="toc-sublist">`; openH3 = true; }
      html += `<li><a href="#${h.id}" class="toc-link toc-l3" data-target="${h.id}">${escapeHtml(h.text)}</a></li>`;
    }
  }
  if (openH3) html += "</ol></li>";
  else if (!firstItem) html += "</li>";
  html += "</ol>";
  return html;
}

// ---- CSS ------------------------------------------------------------------

const CSS = String.raw`
:root {
  --c-bg: #f8fafc;
  --c-bg-elev: #ffffff;
  --c-bg-soft: #f1f5f9;
  --c-text: #1e293b;
  --c-text-muted: #64748b;
  --c-text-strong: #0f172a;
  --c-border: #e2e8f0;
  --c-border-strong: #cbd5e1;
  --c-accent: #2563eb;
  --c-accent-hover: #1d4ed8;
  --c-accent-soft: #dbeafe;
  --c-success: #10b981;
  --c-code-bg: #0f172a;
  --c-code-text: #e2e8f0;
  --c-code-border: #1e293b;
  --c-inline-bg: #f1f5f9;
  --c-inline-text: #be185d;
  --c-table-head: #1e293b;
  --c-table-head-text: #f8fafc;
  --c-table-row-alt: #f8fafc;
  --c-table-row-hover: #eff6ff;
  --c-blockquote-bg: #eff6ff;
  --c-blockquote-border: #2563eb;
  --c-blockquote-text: #1e3a8a;
  --c-cover-from: #0f172a;
  --c-cover-via: #1e3a8a;
  --c-cover-to: #2563eb;
  --shadow-sm: 0 1px 3px rgba(15, 23, 42, .06), 0 1px 2px rgba(15, 23, 42, .04);
  --shadow-md: 0 4px 12px rgba(15, 23, 42, .08), 0 2px 4px rgba(15, 23, 42, .04);
  --shadow-lg: 0 12px 32px rgba(15, 23, 42, .12), 0 4px 8px rgba(15, 23, 42, .06);
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
  --sidebar-w: 320px;
  --header-h: 64px;
}

[data-theme="dark"] {
  --c-bg: #0b1220;
  --c-bg-elev: #121a2c;
  --c-bg-soft: #1a2438;
  --c-text: #cbd5e1;
  --c-text-muted: #94a3b8;
  --c-text-strong: #f1f5f9;
  --c-border: #1e293b;
  --c-border-strong: #334155;
  --c-accent: #60a5fa;
  --c-accent-hover: #93c5fd;
  --c-accent-soft: rgba(96, 165, 250, .14);
  --c-code-bg: #060b16;
  --c-code-text: #e2e8f0;
  --c-code-border: #1e293b;
  --c-inline-bg: #1a2438;
  --c-inline-text: #f9a8d4;
  --c-table-head: #1e3a8a;
  --c-table-head-text: #f1f5f9;
  --c-table-row-alt: #131c30;
  --c-table-row-hover: rgba(96, 165, 250, .08);
  --c-blockquote-bg: rgba(96, 165, 250, .08);
  --c-blockquote-border: #60a5fa;
  --c-blockquote-text: #bfdbfe;
}

* { box-sizing: border-box; }
html { scroll-behavior: smooth; scroll-padding-top: calc(var(--header-h) + 16px); }
body {
  margin: 0; padding: 0;
  background: var(--c-bg);
  color: var(--c-text);
  font-family: "Inter", "Segoe UI", "Helvetica Neue", Arial, system-ui, sans-serif;
  font-size: 15px; line-height: 1.7;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

/* HEADER */
.app-header {
  position: sticky; top: 0; z-index: 100;
  height: var(--header-h);
  background: rgba(255, 255, 255, .82);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--c-border);
  display: flex; align-items: center;
  padding: 0 24px; gap: 16px;
}
[data-theme="dark"] .app-header { background: rgba(11, 18, 32, .82); }

.app-header .brand {
  display: flex; align-items: center; gap: 12px;
  font-weight: 700; color: var(--c-text-strong);
  text-decoration: none; font-size: 16px;
}
.app-header .brand-logo {
  width: 36px; height: 36px;
  border-radius: 10px;
  background: linear-gradient(135deg, #2563eb 0%, #0ea5e9 100%);
  display: flex; align-items: center; justify-content: center;
  color: white; font-weight: 800; font-size: 14px;
  box-shadow: var(--shadow-md);
}
.app-header .brand-meta { display: flex; flex-direction: column; line-height: 1.15; }
.app-header .brand-meta small {
  font-size: 11px; color: var(--c-text-muted); font-weight: 500; letter-spacing: .4px;
}
.app-header .spacer { flex: 1; }

.app-header .header-btn {
  appearance: none;
  border: 1px solid var(--c-border-strong);
  background: var(--c-bg-elev); color: var(--c-text);
  height: 36px; padding: 0 14px;
  border-radius: 8px;
  font-size: 13px; font-weight: 600;
  cursor: pointer; text-decoration: none;
  display: inline-flex; align-items: center; gap: 6px;
  transition: all .15s ease;
}
.app-header .header-btn:hover { border-color: var(--c-accent); color: var(--c-accent); transform: translateY(-1px); }
.app-header .header-btn.icon { width: 36px; padding: 0; justify-content: center; }
.app-header .header-btn.primary {
  background: var(--c-accent); border-color: var(--c-accent); color: white;
}
.app-header .header-btn.primary:hover { background: var(--c-accent-hover); border-color: var(--c-accent-hover); color: white; }

.plan-switch {
  display: inline-flex; align-items: center; gap: 0;
  background: var(--c-bg-soft);
  border: 1px solid var(--c-border);
  border-radius: 10px; padding: 3px;
  height: 36px;
}
.plan-switch a {
  text-decoration: none; color: var(--c-text-muted);
  padding: 0 12px; height: 28px;
  display: inline-flex; align-items: center;
  border-radius: 7px; font-size: 12.5px; font-weight: 600;
  transition: all .15s ease;
  white-space: nowrap;
}
.plan-switch a:hover { color: var(--c-text-strong); }
.plan-switch a.current {
  background: var(--c-bg-elev); color: var(--c-accent);
  box-shadow: var(--shadow-sm);
}

.menu-toggle { display: none; }

/* LAYOUT */
.app-layout {
  display: grid; grid-template-columns: var(--sidebar-w) 1fr;
  gap: 0; max-width: 1400px; margin: 0 auto;
}

/* SIDEBAR */
.sidebar {
  position: sticky; top: var(--header-h);
  height: calc(100vh - var(--header-h));
  overflow-y: auto;
  padding: 28px 18px 28px 28px;
  border-right: 1px solid var(--c-border);
  scrollbar-width: thin;
  scrollbar-color: var(--c-border-strong) transparent;
}
.sidebar::-webkit-scrollbar { width: 6px; }
.sidebar::-webkit-scrollbar-thumb { background: var(--c-border-strong); border-radius: 3px; }

.sidebar h3 {
  font-size: 11px; text-transform: uppercase; letter-spacing: 1.6px;
  font-weight: 700; color: var(--c-text-muted); margin: 0 0 16px 0;
}

.toc-list, .toc-sublist { list-style: none; padding-left: 0; margin: 0; }
.toc-list > li { margin: 4px 0; }
.toc-link {
  display: block; padding: 7px 12px;
  border-radius: 7px; color: var(--c-text);
  text-decoration: none; font-size: 13.5px;
  border-left: 2px solid transparent;
  transition: all .15s ease;
}
.toc-link:hover { background: var(--c-bg-soft); color: var(--c-accent); }
.toc-link.toc-l2 { font-weight: 600; color: var(--c-text-strong); }
.toc-link.toc-l3 { font-size: 12.5px; padding-left: 26px; color: var(--c-text-muted); }
.toc-link.active {
  background: var(--c-accent-soft); color: var(--c-accent);
  border-left-color: var(--c-accent); font-weight: 700;
}
.toc-sublist { margin: 2px 0 6px 0; padding-left: 0; }
.toc-sublist > li { margin: 2px 0; }

/* MAIN */
.main { padding: 0 40px 80px 40px; min-width: 0; }

/* HERO */
.hero {
  margin: 28px 0 56px 0;
  padding: 56px 48px;
  border-radius: var(--radius-lg);
  background:
    radial-gradient(circle at 20% 0%, rgba(59, 130, 246, .35), transparent 40%),
    radial-gradient(circle at 80% 100%, rgba(14, 165, 233, .25), transparent 40%),
    linear-gradient(135deg, var(--c-cover-from) 0%, var(--c-cover-via) 60%, var(--c-cover-to) 100%);
  color: #f8fafc;
  position: relative; overflow: hidden;
  box-shadow: var(--shadow-lg);
}
.hero::before {
  content: ""; position: absolute; inset: 0;
  background-image:
    linear-gradient(rgba(255,255,255,.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,.04) 1px, transparent 1px);
  background-size: 32px 32px;
  pointer-events: none;
}
.hero > * { position: relative; }
.hero .badge {
  display: inline-block;
  padding: 6px 14px;
  background: rgba(255,255,255,.08);
  border: 1px solid rgba(255,255,255,.2);
  border-radius: 999px;
  font-size: 11px; letter-spacing: 2px; text-transform: uppercase;
  color: #cbd5e1; font-weight: 600;
}
.hero h1 {
  font-size: 48px; margin: 18px 0 8px 0;
  font-weight: 800; letter-spacing: -1.5px;
  color: #ffffff; line-height: 1.1;
  border: none; padding: 0;
}
.hero .subtitle {
  font-size: 18px; color: #cbd5e1;
  margin: 0 0 32px 0; font-weight: 400;
}
.hero .chips { display: flex; gap: 10px; flex-wrap: wrap; margin: 18px 0 12px 0; }
.hero .chip {
  background: rgba(255,255,255,.1);
  border: 1px solid rgba(255,255,255,.22);
  border-radius: 8px; padding: 8px 14px;
  font-size: 13px; color: #e2e8f0; font-weight: 500;
}
.hero .author-card {
  margin-top: 36px; padding: 20px 26px;
  border: 1px solid rgba(255,255,255,.2);
  border-radius: var(--radius-md);
  background: rgba(15,23,42,.4);
  backdrop-filter: blur(10px);
  max-width: 520px;
}
.hero .author-card .label {
  font-size: 10px; text-transform: uppercase; letter-spacing: 2.5px;
  color: #94a3b8; margin-bottom: 6px; font-weight: 700;
}
.hero .author-card .name {
  font-size: 20px; font-weight: 700; color: #ffffff; margin-bottom: 4px;
}
.hero .author-card .role { font-size: 13px; color: #cbd5e1; margin-bottom: 10px; }
.hero .author-card .slogan { font-size: 13px; font-style: italic; color: #93c5fd; }
.hero .cover-footer {
  margin-top: 24px; font-size: 12px; color: #94a3b8;
  letter-spacing: 1.5px; text-transform: uppercase;
}

/* TYPOGRAPHY */
.content h1, .content h2, .content h3, .content h4, .content h5, .content h6 {
  color: var(--c-text-strong); font-weight: 700; line-height: 1.3;
  margin: 2em 0 0.6em 0;
  scroll-margin-top: calc(var(--header-h) + 16px);
  position: relative;
}
.content h1 {
  font-size: 32px; border-bottom: 3px solid var(--c-accent); padding-bottom: 0.3em;
}
.content h2 {
  font-size: 26px; border-bottom: 1px solid var(--c-border); padding-bottom: 0.3em;
}
.content h3 { font-size: 20px; color: var(--c-accent); }
.content h4 { font-size: 17px; color: var(--c-text-strong); }
.content h5 { font-size: 14px; color: var(--c-text-muted); text-transform: uppercase; letter-spacing: 1.2px; }

.heading-anchor {
  position: absolute; left: -22px;
  color: var(--c-border-strong); text-decoration: none;
  opacity: 0; transition: opacity .15s ease;
  font-weight: 400;
}
.content h1:hover .heading-anchor,
.content h2:hover .heading-anchor,
.content h3:hover .heading-anchor,
.content h4:hover .heading-anchor { opacity: 1; }
.heading-anchor:hover { color: var(--c-accent); }

.content p { margin: 0.8em 0; }
.content a { color: var(--c-accent); text-decoration: none; border-bottom: 1px solid transparent; transition: border-color .15s; }
.content a:hover { border-bottom-color: var(--c-accent); }
.content strong { color: var(--c-text-strong); font-weight: 700; }
.content em { color: var(--c-text); font-style: italic; }

.content ul, .content ol { margin: 0.8em 0 1em 0; padding-left: 1.8em; }
.content li { margin: 0.3em 0; }
.content li::marker { color: var(--c-accent); }
.content ul li input[type="checkbox"] { margin-right: 8px; transform: translateY(1px); }

.content blockquote {
  margin: 1.2em 0; padding: 14px 20px;
  border-left: 4px solid var(--c-blockquote-border);
  background: var(--c-blockquote-bg);
  color: var(--c-blockquote-text);
  border-radius: 0 var(--radius-md) var(--radius-md) 0;
  box-shadow: var(--shadow-sm);
}
.content blockquote p { margin: 0.3em 0; }
.content blockquote strong { color: var(--c-blockquote-text); }
.content blockquote a { color: var(--c-blockquote-text); border-bottom: 1px solid var(--c-blockquote-text); }

.content :not(pre) > code {
  background: var(--c-inline-bg); color: var(--c-inline-text);
  padding: 2px 7px; border-radius: 5px;
  font-family: "JetBrains Mono", "Cascadia Code", "Consolas", monospace;
  font-size: 0.88em; font-weight: 500;
  border: 1px solid var(--c-border);
}

.code-block {
  position: relative; margin: 1.2em 0;
  border-radius: var(--radius-md); overflow: hidden;
  box-shadow: var(--shadow-md);
  background: var(--c-code-bg);
  border: 1px solid var(--c-code-border);
}
.code-block pre.hljs {
  margin: 0; padding: 18px 18px 18px 18px; padding-top: 38px;
  background: transparent; color: var(--c-code-text);
  font-size: 13px; line-height: 1.6; overflow-x: auto;
  font-family: "JetBrains Mono", "Cascadia Code", "Consolas", monospace;
}
.code-block pre.hljs code {
  background: transparent; color: inherit;
  padding: 0; border: none; font-family: inherit;
}
.code-block .code-lang {
  position: absolute; top: 10px; left: 16px;
  font-size: 10.5px; letter-spacing: 1.6px; text-transform: uppercase;
  color: #94a3b8; font-family: "Inter", system-ui, sans-serif;
  font-weight: 700; user-select: none;
}
.code-block .code-copy {
  position: absolute; top: 8px; right: 10px;
  appearance: none;
  border: 1px solid rgba(255,255,255,.14);
  background: rgba(255,255,255,.04); color: #cbd5e1;
  font-size: 11px; font-weight: 600;
  padding: 4px 10px; border-radius: 6px;
  cursor: pointer; font-family: "Inter", system-ui, sans-serif;
  letter-spacing: .4px; transition: all .15s ease;
}
.code-block .code-copy:hover { background: rgba(255,255,255,.12); color: #fff; border-color: rgba(255,255,255,.3); }
.code-block .code-copy.copied { background: rgba(16,185,129,.2); color: #6ee7b7; border-color: rgba(16,185,129,.4); }

.hljs-comment, .hljs-quote { color: #94a3b8; font-style: italic; }
.hljs-keyword, .hljs-selector-tag, .hljs-built_in, .hljs-name, .hljs-tag { color: #c084fc; }
.hljs-string, .hljs-doctag, .hljs-template-tag, .hljs-template-variable { color: #86efac; }
.hljs-title, .hljs-section, .hljs-selector-id, .hljs-title.class_, .hljs-title.function_ { color: #fde68a; }
.hljs-number, .hljs-literal, .hljs-symbol, .hljs-attr { color: #fda4af; }
.hljs-type, .hljs-class .hljs-title { color: #67e8f9; }
.hljs-attribute, .hljs-variable, .hljs-meta, .hljs-params { color: #93c5fd; }
.hljs-deletion { color: #fca5a5; }
.hljs-addition { color: #86efac; }
.hljs-emphasis { font-style: italic; }
.hljs-strong { font-weight: 700; }

.table-wrap {
  overflow-x: auto; margin: 1.2em 0;
  border: 1px solid var(--c-border-strong);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  background: var(--c-bg-elev);
}
.content table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
.content thead { background: var(--c-table-head); }
.content thead th {
  color: var(--c-table-head-text); text-align: left;
  padding: 10px 16px; font-weight: 600; font-size: 13px;
  letter-spacing: .2px; white-space: nowrap;
}
.content tbody td {
  padding: 9px 16px; border-top: 1px solid var(--c-border); vertical-align: top;
}
.content tbody tr:nth-child(even) { background: var(--c-table-row-alt); }
.content tbody tr:hover { background: var(--c-table-row-hover); }

.content hr { border: none; height: 1px; background: var(--c-border); margin: 2.2em 0; }
.content img { max-width: 100%; height: auto; border-radius: var(--radius-md); box-shadow: var(--shadow-md); }

/* BACK TO TOP */
.back-top {
  position: fixed; bottom: 24px; right: 24px;
  width: 44px; height: 44px; border-radius: 50%;
  background: var(--c-accent); color: white;
  border: none; cursor: pointer;
  font-size: 20px; box-shadow: var(--shadow-lg);
  display: flex; align-items: center; justify-content: center;
  opacity: 0; pointer-events: none;
  transform: translateY(8px);
  transition: all .25s ease; z-index: 90;
}
.back-top.visible { opacity: 1; pointer-events: auto; transform: translateY(0); }
.back-top:hover { background: var(--c-accent-hover); transform: translateY(-2px); }

/* PROGRESS */
.scroll-progress {
  position: fixed; top: 0; left: 0; height: 3px; width: 0;
  background: linear-gradient(90deg, var(--c-accent), #0ea5e9);
  z-index: 200; transition: width .08s linear;
}

/* RESPONSIVE */
@media (max-width: 1024px) {
  .app-layout { grid-template-columns: 1fr; }
  .menu-toggle { display: inline-flex; }
  .sidebar {
    position: fixed; top: var(--header-h); left: 0;
    width: var(--sidebar-w); height: calc(100vh - var(--header-h));
    background: var(--c-bg); z-index: 95;
    transform: translateX(-100%); transition: transform .25s ease;
    border-right: 1px solid var(--c-border);
    box-shadow: var(--shadow-lg);
  }
  .sidebar.open { transform: translateX(0); }
  .sidebar-overlay {
    position: fixed; inset: var(--header-h) 0 0 0;
    background: rgba(15, 23, 42, .4); backdrop-filter: blur(2px);
    z-index: 94; opacity: 0; pointer-events: none;
    transition: opacity .2s ease;
  }
  .sidebar-overlay.visible { opacity: 1; pointer-events: auto; }
  .main { padding: 0 22px 60px 22px; }
  .hero { padding: 40px 28px; margin: 20px 0 36px 0; }
  .hero h1 { font-size: 34px; }
  .hero .subtitle { font-size: 16px; }
}

@media (max-width: 720px) {
  .plan-switch a { padding: 0 8px; font-size: 11.5px; }
}

@media (max-width: 640px) {
  .app-header { padding: 0 14px; gap: 8px; }
  .app-header .brand-meta small { display: none; }
  .app-header .header-btn span.label { display: none; }
  .app-header .header-btn { padding: 0 10px; }
  :root { --sidebar-w: 280px; }
  .hero { padding: 30px 20px; border-radius: 12px; }
  .hero h1 { font-size: 28px; }
  .hero .author-card { padding: 16px 18px; }
  .main { padding: 0 14px 60px 14px; }
  .content h2 { font-size: 22px; }
  .content h3 { font-size: 18px; }
  .back-top { bottom: 16px; right: 16px; }
}

@media print {
  .app-header, .sidebar, .back-top, .scroll-progress, .code-copy, .heading-anchor { display: none !important; }
  .app-layout { grid-template-columns: 1fr; }
  .main { padding: 0; }
  body { background: white; color: black; font-size: 11pt; }
  .hero { page-break-after: always; }
  .content h1, .content h2 { page-break-before: auto; page-break-after: avoid; }
  .code-block, .table-wrap { page-break-inside: avoid; }
}

:focus-visible { outline: 2px solid var(--c-accent); outline-offset: 2px; border-radius: 4px; }
`;

// ---- JS -------------------------------------------------------------------

const JS = String.raw`
(function () {
  var THEME_KEY = "nzolanet-theme";
  var root = document.documentElement;
  var saved = localStorage.getItem(THEME_KEY);
  if (saved === "dark" || (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
    root.setAttribute("data-theme", "dark");
  }
  document.getElementById("theme-toggle").addEventListener("click", function () {
    var current = root.getAttribute("data-theme") === "dark" ? "dark" : "light";
    var next = current === "dark" ? "light" : "dark";
    if (next === "dark") root.setAttribute("data-theme", "dark");
    else root.removeAttribute("data-theme");
    localStorage.setItem(THEME_KEY, next);
    updateThemeIcon();
  });
  function updateThemeIcon() {
    var dark = root.getAttribute("data-theme") === "dark";
    var ic = document.getElementById("theme-icon"); if (ic) ic.textContent = dark ? "☀" : "☾";
    var lb = document.getElementById("theme-label"); if (lb) lb.textContent = dark ? "Claro" : "Escuro";
  }
  updateThemeIcon();

  var sidebar = document.getElementById("sidebar");
  var overlay = document.getElementById("sidebar-overlay");
  var menuBtn = document.getElementById("menu-toggle");
  function closeSidebar() { sidebar.classList.remove("open"); overlay.classList.remove("visible"); }
  function openSidebar() { sidebar.classList.add("open"); overlay.classList.add("visible"); }
  menuBtn.addEventListener("click", function () {
    if (sidebar.classList.contains("open")) closeSidebar(); else openSidebar();
  });
  overlay.addEventListener("click", closeSidebar);
  sidebar.addEventListener("click", function (e) {
    if (e.target.classList && e.target.classList.contains("toc-link") && window.innerWidth <= 1024) {
      closeSidebar();
    }
  });

  document.querySelectorAll(".code-copy").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var code = btn.getAttribute("data-code") || "";
      var ta = document.createElement("textarea"); ta.innerHTML = code; var raw = ta.value;
      navigator.clipboard.writeText(raw).then(function () {
        btn.textContent = "Copiado!"; btn.classList.add("copied");
        setTimeout(function () { btn.textContent = "Copiar"; btn.classList.remove("copied"); }, 1600);
      });
    });
  });

  var backTop = document.getElementById("back-top");
  var progress = document.getElementById("scroll-progress");
  window.addEventListener("scroll", function () {
    var scrolled = window.scrollY;
    var height = document.documentElement.scrollHeight - window.innerHeight;
    var pct = height > 0 ? (scrolled / height) * 100 : 0;
    progress.style.width = pct + "%";
    if (scrolled > 400) backTop.classList.add("visible");
    else backTop.classList.remove("visible");
  }, { passive: true });
  backTop.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  var tocLinks = document.querySelectorAll(".toc-link");
  var tocMap = {};
  tocLinks.forEach(function (link) {
    var id = link.getAttribute("data-target");
    if (id) tocMap[id] = link;
  });
  var headings = document.querySelectorAll(".content h2[id], .content h3[id]");
  var visibleHeadings = new Set();
  function setActive(id) {
    tocLinks.forEach(function (l) { l.classList.remove("active"); });
    if (tocMap[id]) {
      tocMap[id].classList.add("active");
      var parent = document.getElementById("sidebar");
      var linkTop = tocMap[id].offsetTop;
      var linkHeight = tocMap[id].offsetHeight;
      if (linkTop < parent.scrollTop || linkTop + linkHeight > parent.scrollTop + parent.clientHeight) {
        parent.scrollTo({ top: linkTop - parent.clientHeight / 2 + linkHeight / 2, behavior: "smooth" });
      }
    }
  }
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) visibleHeadings.add(entry.target.id);
      else visibleHeadings.delete(entry.target.id);
    });
    if (visibleHeadings.size > 0) {
      var first = null;
      headings.forEach(function (h) { if (!first && visibleHeadings.has(h.id)) first = h.id; });
      if (first) setActive(first);
    }
  }, { rootMargin: "-20% 0px -70% 0px", threshold: 0 });
  headings.forEach(function (h) { observer.observe(h); });
  if (headings.length > 0) setActive(headings[0].id);

  document.addEventListener("keydown", function (e) {
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
    if (e.key === "t" || e.key === "T") { document.getElementById("theme-toggle").click(); }
  });
})();
`;

// ---- Build de um target ---------------------------------------------------

function buildOne(target) {
  let md = readFileSync(target.inputMd, "utf8");

  // Cortar o cabeçalho do markdown (titulo + 2 blockquotes + 2 hr's iniciais)
  const lines = md.split(/\r?\n/);
  let hrCount = 0;
  let cutAt = 0;
  for (let i = 0; i < lines.length; i++) {
    if (/^---\s*$/.test(lines[i])) {
      hrCount++;
      if (hrCount === 2) { cutAt = i + 1; break; }
    }
  }
  md = lines.slice(cutAt).join("\n").replace(/^\s+/, "");

  // Tambem, caso haja um terceiro blockquote (link para outro plano), nao cortar.

  const headings = [];
  const slugUsed = new Map();
  const marked = buildMarked(headings, slugUsed);
  const bodyHtml = marked.parse(md);
  const tocHtml = buildToc(headings);

  const chips1 = target.chips1.map(c => `<span class="chip">${c}</span>`).join("");
  const chips2 = target.chips2.map(c => `<span class="chip">${c}</span>`).join("");

  const html = `<!doctype html>
<html lang="pt-pt">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#0f172a">
<meta name="description" content="${target.title} do projeto NzolaNet - Angular + ASP.NET Web API + SQL Server. Por Willfredy Vieira Dias.">
<title>NzolaNet · ${target.title}</title>
<style>${CSS}</style>
</head>
<body>

<div class="scroll-progress" id="scroll-progress"></div>

<header class="app-header">
  <button class="header-btn icon menu-toggle" id="menu-toggle" aria-label="Abrir indice">☰</button>
  <a class="brand" href="#">
    <span class="brand-logo">NN</span>
    <span class="brand-meta">
      <span>NzolaNet</span>
      <small>${target.title} · Projecto AW</small>
    </span>
  </a>
  <nav class="plan-switch" aria-label="Alternar entre planos">
    <a class="current" href="./${basename(target.outputHtml)}" aria-current="page">${target.nav.currentLabel}</a>
    <a href="./${target.nav.otherFile}">${target.nav.otherLabel}</a>
  </nav>
  <div class="spacer"></div>
  <button class="header-btn" id="theme-toggle" type="button" title="Alternar tema (T)">
    <span id="theme-icon">☾</span>
    <span class="label" id="theme-label">Escuro</span>
  </button>
  <a class="header-btn primary" href="./${target.pdfFile}" target="_blank" rel="noopener" title="Abrir PDF">
    <span>📄</span><span class="label">PDF</span>
  </a>
</header>

<div class="sidebar-overlay" id="sidebar-overlay"></div>

<div class="app-layout">
  <aside class="sidebar" id="sidebar" aria-label="Indice do documento">
    <h3>Indice</h3>
    ${tocHtml}
  </aside>

  <main class="main">
    <section class="hero">
      <span class="badge">${target.badge}</span>
      <h1>${target.titleHtml}</h1>
      <p class="subtitle">${target.subtitle}</p>

      <div class="chips">${chips1}</div>
      <div class="chips">${chips2}</div>

      <div class="author-card">
        <div class="label">Feito por</div>
        <div class="name">Willfredy Vieira Dias</div>
        <div class="role">Backend com ASP.NET Web API</div>
        <div class="slogan">"Nerd Altamente e Programador de Computadores 🤓✌️"</div>
      </div>

      <div class="cover-footer">${target.coverFooter}</div>
    </section>

    <article class="content">
${bodyHtml}
    </article>
  </main>
</div>

<button class="back-top" id="back-top" aria-label="Voltar ao topo">↑</button>

<script>${JS}</script>

</body>
</html>`;

  writeFileSync(target.outputHtml, html, "utf8");
  console.log(`  ✓ ${basename(target.outputHtml)}  (${(html.length / 1024).toFixed(1)} KB · ${headings.length} headings)`);
}

// ---- Run ------------------------------------------------------------------

console.log("Gerando paginas HTML...\n");
for (const target of TARGETS) {
  buildOne(target);
}
console.log("\nConcluido. Ficheiros em:", PLANO_DIR);
