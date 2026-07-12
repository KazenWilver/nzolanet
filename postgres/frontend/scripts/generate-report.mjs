import { chromium } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..', '..')
const docsDir = path.join(repoRoot, 'docs')
const assetsDir = path.join(docsDir, 'report-assets')
const htmlPath = path.join(docsDir, 'relatorio-nzolanet.html')
const pdfPath = path.join(docsDir, 'relatorio-nzolanet.pdf')

const baseUrl = 'http://localhost:4200'
const userCredentials = {
  email: 'will@gmail.com',
  password: 'Aa123456789'
}
const adminCredentials = {
  email: 'admin@nzolanet.ao',
  password: 'NzolaAdmin@2026'
}

const formatDate = new Intl.DateTimeFormat('pt-PT', {
  day: '2-digit',
  month: 'long',
  year: 'numeric'
})

const groupMembers = [
  { name: 'Willfredy Vieira Dias', number: '20200204', role: 'Backend — API ASP.NET, SQL Server e segurança' },
  { name: 'Manuel Sulo', number: '20221465', role: 'Frontend — feed, notificações, design system' },
  { name: 'Jeovani Sassombo', number: '20220737', role: 'Frontend — publicações, comentários e interacções' },
  { name: 'Emer Tavares', number: '20220633', role: 'Frontend — autenticação, perfil e experiência do utilizador' }
]

const screenshots = [
  { file: '01-user-login.png', title: 'Login da NzolaNet', caption: 'Ecrã de entrada na aplicação principal, com email e palavra-passe.' },
  { file: '02-user-register.png', title: 'Registo na NzolaNet', caption: 'Formulário de criação de conta para novos utilizadores da plataforma.' },
  { file: '03-admin-login.png', title: 'Login do painel admin', caption: 'Ecrã de autenticação reservado a administradores da NzolaNet.' },
  { file: '04-admin-register.png', title: 'Registo de administrador', caption: 'Formulário de registo admin, protegido por código de convite.' },
  { file: '05-feed.png', title: 'Feed principal', caption: 'Feed da NzolaNet com publicações recentes e painel lateral de tendências.' },
  { file: '06-feed-composer.png', title: 'Criação de publicação', caption: 'Compositor de publicações no feed, com texto a ser escrito pelo utilizador.' },
  { file: '07-feed-repost.png', title: 'Publicação repartilhada', caption: 'Feed com uma publicação repartilhada visível na linha temporal.' },
  { file: '08-search.png', title: 'Pesquisa', caption: 'Ecrã de pesquisa com sugestões de tendências e perfis a seguir.' },
  { file: '09-search-user.png', title: 'Pesquisa de utilizador', caption: 'Resultados da pesquisa pelo utilizador «olise».' },
  { file: '10-notifications.png', title: 'Notificações', caption: 'Lista de notificações geradas por interacções na plataforma.' },
  { file: '11-messages-inbox.png', title: 'Lista de mensagens', caption: 'Caixa de entrada com conversas directas e de grupo.' },
  { file: '12-messages-chat.png', title: 'Conversa directa', caption: 'Chat aberto com mensagens trocadas entre utilizadores.' },
  { file: '13-messages-group.png', title: 'Chat de grupo', caption: 'Conversa de grupo com vários participantes.' },
  { file: '14-fimbu.png', title: 'Assistente Fimbu', caption: 'Área dedicada à Fimbu, assistente de IA integrada na plataforma.' },
  { file: '15-fimbu-interaction.png', title: 'Interacção com a Fimbu', caption: 'Conversa activa com a Fimbu, ilustrando uma resposta gerada.' },
  { file: '16-bookmarks.png', title: 'Guardados', caption: 'Publicações guardadas pelo utilizador na secção Guardados.' },
  { file: '17-profile-publications.png', title: 'Perfil — publicações', caption: 'Perfil do utilizador com o separador Publicações activo.' },
  { file: '18-profile-media.png', title: 'Perfil — media', caption: 'Perfil do utilizador com o separador Media activo.' },
  { file: '19-profile-likes.png', title: 'Perfil — gostos', caption: 'Perfil do utilizador com o separador Gostos activo.' },
  { file: '20-profile-reposts.png', title: 'Perfil — repartilhas', caption: 'Perfil do utilizador com o separador Repartilhas activo.' },
  { file: '21-settings-account.png', title: 'Definições — conta', caption: 'Secção Conta nas definições, com dados pessoais editáveis.' },
  { file: '22-settings-privacy.png', title: 'Definições — privacidade', caption: 'Secção Privacidade, incluindo opção de perfil público ou privado.' },
  { file: '23-settings-password.png', title: 'Definições — palavra-passe', caption: 'Secção para alteração de palavra-passe.' },
  { file: '24-feed-dark.png', title: 'Feed em modo escuro', caption: 'Feed principal com o tema escuro activo.' },
  { file: '25-admin-indicators.png', title: 'Admin — indicadores', caption: 'Painel administrativo com métricas gerais da plataforma.' },
  { file: '26-admin-charts.png', title: 'Admin — gráficos', caption: 'Visualização gráfica dos indicadores administrativos.' },
  { file: '27-admin-moderation.png', title: 'Admin — moderação', caption: 'Secção de moderação com publicação denunciada pendente de revisão.' }
]

const tocEntries = [
  { id: 'introducao', label: '1. Introdução' },
  { id: 'contexto', label: '2. Contexto e enunciado do projecto' },
  { id: 'grupo', label: '3. Identificação do grupo' },
  { id: 'objectivos', label: '4. Objectivos' },
  { id: 'tecnologias', label: '5. Tecnologias escolhidas' },
  { id: 'arquitectura', label: '6. Arquitectura da solução' },
  { id: 'o-que-faz', label: '7. O que faz a aplicação' },
  { id: 'funcionalidades', label: '8. Funcionalidades implementadas' },
  { id: 'funcionalidades-extra', label: '9. Funcionalidades adicionais' },
  { id: 'nao-faz', label: '10. O que a aplicação não faz' },
  { id: 'requisitos-nf', label: '11. Requisitos não funcionais' },
  { id: 'desafios', label: '12. Desafios encontrados' },
  { id: 'vantagens', label: '13. Vantagens da solução' },
  { id: 'capturas', label: '14. Capturas de ecrã' },
  { id: 'conclusao', label: '15. Conclusão' }
]

const asset = filename => pathToFileURL(path.join(assetsDir, filename)).href

const escapeHtml = value =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')

async function ensureDirectories() {
  await mkdir(assetsDir, { recursive: true })
}

async function snap(page, filename) {
  const target = path.join(assetsDir, filename)
  const resume = process.argv.includes('--resume-capture')
  if (resume && existsSync(target)) {
    console.log(`  ↷ ${filename} (já existe)`)
    return
  }
  await page.waitForTimeout(900)
  await page.screenshot({ path: target })
  console.log(`  ✓ ${filename}`)
}

async function loginAsUser(page) {
  await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded' })
  await page.locator('#login-email').fill(userCredentials.email)
  await page.locator('#login-password').fill(userCredentials.password)
  await Promise.all([
    page.waitForURL(url => !url.pathname.endsWith('/login'), { timeout: 45000 }),
    page.locator('button[type="submit"]').click()
  ])
  await page.waitForTimeout(2500)
}

async function findOtherPublicationCard(page) {
  const cards = page.locator('article.publication-card')
  const count = await cards.count()
  for (let index = 0; index < count; index += 1) {
    const card = cards.nth(index)
    await card.locator('.publication-card__menu-btn').click()
    const reportItem = page.locator('.publication-card__menu-item', { hasText: 'Denunciar' })
    if (await reportItem.count()) {
      await page.keyboard.press('Escape')
      return card
    }
    await page.keyboard.press('Escape')
  }
  return null
}

async function ensureReportedPublication(page) {
  await page.goto(`${baseUrl}/feed`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(2000)

  const result = await page.evaluate(async () => {
    const token = localStorage.getItem('nzolanet_token')
    const userRaw = localStorage.getItem('nzolanet_user')
    if (!token || !userRaw) {
      return { ok: false, reason: 'sem-autenticação' }
    }

    const user = JSON.parse(userRaw)
    const feedResponse = await fetch('/api/publications/feed?page=1&pageSize=30', {
      headers: { Authorization: `Bearer ${token}` }
    })

    if (!feedResponse.ok) {
      return { ok: false, reason: 'feed-indisponível' }
    }

    const feed = await feedResponse.json()
    const items = feed.items ?? []
    const target = items.find(item => item.authorId !== user.id)
    if (!target) {
      return { ok: false, reason: 'sem-publicação-alvo' }
    }

    const reportResponse = await fetch(`/api/publications/${target.id}/report`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        reason: 'spam',
        details: 'Denúncia registada para demonstração no painel administrativo.'
      })
    })

    if (reportResponse.ok) {
      return { ok: true, created: true }
    }

    const errorText = await reportResponse.text()
    if (errorText.includes('Já denunciaste')) {
      return { ok: true, created: false }
    }

    return { ok: false, reason: errorText || reportResponse.status }
  })

  console.log(`  denúncia preparada: ${JSON.stringify(result)}`)
}

async function reportPublication(page, card) {
  await card.locator('.publication-card__menu-btn').click()
  const reportItem = page.locator('.publication-card__menu-item', { hasText: 'Denunciar' })
  if (!(await reportItem.count())) {
    return false
  }
  await reportItem.click()
  await page.locator('.report-dialog__btn--primary', { hasText: 'Enviar denúncia' }).click()
  await page.waitForTimeout(1500)
  return true
}

async function captureMainAppScreenshots(browser) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1200 },
    deviceScaleFactor: 1.25
  })
  const page = await context.newPage()

  await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1500)
  await snap(page, '01-user-login.png')

  await page.goto(`${baseUrl}/register`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1500)
  await snap(page, '02-user-register.png')

  await loginAsUser(page)

  await page.goto(`${baseUrl}/feed`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(3000)
  await snap(page, '05-feed.png')

  await page.locator('.create-publication__trigger').click()
  await page.locator('#publication-text').fill('Relatório AW — demonstração de criação de publicação na NzolaNet.')
  await snap(page, '06-feed-composer.png')
  await page.goto(`${baseUrl}/feed`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(2500)

  const otherCard = await findOtherPublicationCard(page)
  if (otherCard) {
    await otherCard.locator('.publication-card__action--repost').click()
    const repostBtn = page.locator('.repost-dialog__btn--primary', { hasText: 'Repartilhar' })
    if (await repostBtn.count()) {
      await repostBtn.click()
      await page.waitForTimeout(2000)
    }
    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(3000)
  }
  await snap(page, '07-feed-repost.png')

  await page.goto(`${baseUrl}/search`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(2500)
  await snap(page, '08-search.png')

  await page.locator('#search-users-input').fill('olise')
  await page.waitForTimeout(2000)
  await snap(page, '09-search-user.png')

  await page.goto(`${baseUrl}/notifications`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(2500)
  await snap(page, '10-notifications.png')

  await page.goto(`${baseUrl}/messages`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(3500)
  await snap(page, '11-messages-inbox.png')

  const conversations = page.locator('.messages-page__list-item')
  if (await conversations.count()) {
    await conversations.first().click()
    await page.waitForTimeout(2500)
    await snap(page, '12-messages-chat.png')
  }

  let groupOpened = false
  const convCount = await page.locator('.messages-page__list-item').count()
  for (let index = 0; index < convCount; index += 1) {
    await page.goto(`${baseUrl}/messages`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2000)
    await page.locator('.messages-page__list-item').nth(index).click()
    await page.waitForTimeout(1500)
    const groupHeader = page.locator('.messages-page__chat-header button[aria-label="Informações do grupo"]')
    if (await groupHeader.count()) {
      await snap(page, '13-messages-group.png')
      groupOpened = true
      break
    }
  }

  if (!groupOpened) {
    await page.locator('button[aria-label="Nova conversa"]').click()
    await page.locator('.new-conversation__tabs button', { hasText: 'Grupo' }).click()
    await page.locator('input[placeholder="Título do grupo"]').fill('Grupo NzolaNet')
    await page.locator('.new-conversation__search-input').first().fill('olise')
    await page.waitForTimeout(1500)
    const participant = page.locator('.new-conversation__item').first()
    if (await participant.count()) {
      await participant.click()
      await page.locator('.new-conversation__create-btn').click()
      await page.waitForTimeout(3000)
      await snap(page, '13-messages-group.png')
    }
  }

  await page.goto(`${baseUrl}/fimbu`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(2500)
  await snap(page, '14-fimbu.png')

  await page.locator('#fimbu-message').fill('Olá Fimbu, apresenta-te em uma frase.')
  await page.locator('.fimbu-page__send-btn').click()
  await page.waitForSelector('.fimbu-page__bubble--assistant', { timeout: 90000 })
  await page.waitForTimeout(1500)
  await snap(page, '15-fimbu-interaction.png')

  await page.goto(`${baseUrl}/feed`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(2500)
  const bookmarkCard = await findOtherPublicationCard(page)
  if (bookmarkCard) {
    await bookmarkCard.locator('.publication-card__action--bookmark').click()
    await page.waitForTimeout(1200)
  }
  await page.goto(`${baseUrl}/bookmarks`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(2500)
  await snap(page, '16-bookmarks.png')

  await page.goto(`${baseUrl}/profile/me`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(2500)
  await snap(page, '17-profile-publications.png')

  await page.locator('#profile-tab-media').click()
  await page.waitForTimeout(2000)
  await snap(page, '18-profile-media.png')

  await page.locator('#profile-tab-likes').click()
  await page.waitForTimeout(2000)
  await snap(page, '19-profile-likes.png')

  await page.locator('#profile-tab-reposts').click()
  await page.waitForTimeout(2000)
  await snap(page, '20-profile-reposts.png')

  await page.goto(`${baseUrl}/settings`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(2000)
  await snap(page, '21-settings-account.png')

  await page.locator('.settings__sidebar-item').filter({ hasText: 'Privacidade' }).click()
  await page.waitForTimeout(1500)
  await snap(page, '22-settings-privacy.png')

  await page.locator('.settings__sidebar-item').filter({ hasText: 'Palavra-passe' }).click()
  await page.waitForTimeout(1500)
  await snap(page, '23-settings-password.png')

  await page.goto(`${baseUrl}/feed`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1500)
  await page.locator('.sidebar__link--theme').click()
  await page.waitForTimeout(1200)
  await snap(page, '24-feed-dark.png')

  await ensureReportedPublication(page)

  await context.close()
}

async function captureAdminScreenshots(browser) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1200 },
    deviceScaleFactor: 1.25
  })
  const page = await context.newPage()

  await page.goto(`${baseUrl}/admin/login`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1500)
  await snap(page, '03-admin-login.png')

  await page.goto(`${baseUrl}/admin/register`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1500)
  await snap(page, '04-admin-register.png')

  await page.goto(`${baseUrl}/admin/login`, { waitUntil: 'domcontentloaded' })
  await page.locator('#admin-email').fill(adminCredentials.email)
  await page.locator('#admin-password').fill(adminCredentials.password)

  await Promise.all([
    page.waitForURL(url => url.pathname === '/admin', { timeout: 45000 }),
    page.locator('button[type="submit"]').click()
  ])

  await page.waitForSelector('.dashboard__nav-item', { timeout: 30000 })
  await snap(page, '25-admin-indicators.png')

  await page.locator('.dashboard__nav-item').nth(1).click()
  await snap(page, '26-admin-charts.png')

  await page.locator('.dashboard__nav-item').nth(2).click()
  await page.waitForTimeout(2000)
  await page.locator('.tabs__item', { hasText: 'Publicações denunciadas' }).click()
  await page.waitForTimeout(2000)
  await snap(page, '27-admin-moderation.png')

  await context.close()
}

function buildMembersTableRows() {
  return groupMembers
    .map(
      member => `
        <tr>
          <td>${escapeHtml(member.name)}</td>
          <td>${escapeHtml(member.number)}</td>
          <td>${escapeHtml(member.role)}</td>
        </tr>
      `
    )
    .join('')
}

function buildCoverMembersList() {
  return groupMembers
    .map(member => `${escapeHtml(member.name)} · N.º ${escapeHtml(member.number)}`)
    .join('<br>')
}

function buildTocHtml() {
  return tocEntries
    .map(
      entry => `
        <li class="toc__item">
          <a class="toc__link" href="#${entry.id}">
            <span class="toc__label">${escapeHtml(entry.label)}</span>
          </a>
        </li>
      `
    )
    .join('')
}

function buildFigureHtml() {
  return screenshots
    .map(
      (shot, index) => `
        <figure class="figure">
          <img src="${asset(shot.file)}" alt="${escapeHtml(shot.title)}">
          <figcaption>Figura ${index + 1} — ${escapeHtml(shot.caption)}</figcaption>
        </figure>
      `
    )
    .join('\n')
}

function screenshotsExist() {
  return screenshots.every(shot => existsSync(path.join(assetsDir, shot.file)))
}

function buildReportHtml() {
  const today = formatDate.format(new Date())
  const year = new Date().getFullYear()

  return `<!doctype html>
<html lang="pt-PT">
<head>
  <meta charset="utf-8">
  <title>Relatório — NzolaNet</title>
  <style>
    :root {
      --blue-dark: #0b3d6e;
      --blue-mid: #1565a8;
      --blue-soft: #d9eaf7;
      --blue-line: #b3cfe3;
      --text: #111827;
      --muted: #4b5563;
    }

    * { box-sizing: border-box; }

    @page {
      size: A4;
      margin: 14mm 16mm 16mm;
    }

    body {
      margin: 0;
      font-family: Calibri, "Segoe UI", Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.55;
      color: var(--text);
      background: #fff;
    }

    .doc { background: #fff; }

    /* Capa e contra-capa: texto sempre sobre fundo branco sólido */
    .cover,
    .back-cover {
      position: relative;
      min-height: 267mm;
      page-break-after: always;
      background: #fff;
      overflow: hidden;
    }

    .cover__strip-top {
      position: absolute;
      top: 0;
      right: 0;
      width: 48%;
      height: 34mm;
      background: var(--blue-dark);
      clip-path: polygon(18% 0, 100% 0, 100% 100%, 0 100%);
    }

    .cover__strip-bottom {
      position: absolute;
      bottom: 0;
      left: 0;
      width: 42%;
      height: 28mm;
      background: var(--blue-mid);
      clip-path: polygon(0 0, 100% 35%, 100% 100%, 0 100%);
    }

    .cover__panel,
    .back-cover__panel {
      position: relative;
      z-index: 2;
      min-height: 267mm;
      margin: 10mm 12mm;
      padding: 14mm 16mm;
      background: #fff;
      border: 1px solid var(--blue-line);
      display: flex;
      flex-direction: column;
    }

    .cover__inst {
      margin: 0 0 6mm;
      font-size: 9.5pt;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--blue-mid);
      font-weight: 700;
    }

    .cover__course {
      margin: 0 0 2mm;
      font-size: 11pt;
      color: var(--muted);
    }

    .cover__main {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 8mm 0;
    }

    .cover__tag {
      display: inline-block;
      margin-bottom: 5mm;
      padding-bottom: 2mm;
      border-bottom: 3px solid var(--blue-dark);
      font-size: 10pt;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--blue-dark);
    }

    .cover h1 {
      margin: 0 0 4mm;
      font-size: 34pt;
      line-height: 1.05;
      color: var(--blue-dark);
    }

    .cover__subtitle {
      margin: 0;
      max-width: 95%;
      font-size: 13pt;
      color: var(--text);
      line-height: 1.5;
    }

    .cover__meta {
      width: 100%;
      border-collapse: collapse;
      font-size: 10.5pt;
      margin-top: auto;
    }

    .cover__meta th,
    .cover__meta td {
      padding: 2.8mm 3.5mm;
      border: 1px solid var(--blue-line);
      vertical-align: top;
      text-align: left;
    }

    .cover__meta th {
      width: 30%;
      background: var(--blue-soft);
      color: var(--blue-dark);
      font-weight: 700;
    }

    .content { padding: 0; }

    h2.section-title {
      margin: 0 0 4mm;
      padding-bottom: 2mm;
      font-size: 14pt;
      color: var(--blue-dark);
      border-bottom: 2px solid var(--blue-dark);
      break-after: avoid;
    }

    h3 {
      margin: 5mm 0 2.5mm;
      font-size: 12pt;
      color: var(--blue-mid);
      break-after: avoid;
    }

    p {
      margin: 0 0 3.5mm;
      text-align: justify;
    }

    ul, ol {
      margin: 0 0 4mm 5mm;
      padding-left: 4mm;
    }

    li { margin-bottom: 1.5mm; }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 4mm 0 6mm;
      font-size: 10pt;
      break-inside: avoid;
    }

    th, td {
      padding: 2.5mm 3mm;
      border: 1px solid var(--blue-line);
      vertical-align: top;
      text-align: left;
    }

    th {
      background: var(--blue-dark);
      color: #fff;
      font-weight: 600;
    }

    tr:nth-child(even) td { background: #f8fbfd; }

    .page-break { break-before: page; }

    .toc-title {
      margin: 0 0 6mm;
      font-size: 16pt;
      color: var(--blue-dark);
      border-bottom: 2px solid var(--blue-dark);
      padding-bottom: 2mm;
    }

    .toc { list-style: none; margin: 0; padding: 0; }

    .toc__item { margin: 0; padding: 0; }

    .toc__link {
      display: block;
      color: var(--text);
      text-decoration: none;
      padding: 1.8mm 0;
      border-bottom: 1px dotted var(--blue-line);
    }

    .toc__link::after {
      content: leader('.') target-counter(attr(href), page);
      float: right;
      color: var(--blue-mid);
      font-weight: 600;
    }

    .toc__label { background: #fff; padding-right: 2mm; }

    .figure {
      margin: 0 0 8mm;
      padding: 0;
      break-inside: avoid;
    }

    .figure img {
      display: block;
      width: 100%;
      height: auto;
      border: none;
      box-shadow: none;
      border-radius: 0;
    }

    .figure figcaption {
      margin-top: 2.5mm;
      font-size: 9.5pt;
      color: var(--muted);
      text-align: center;
      line-height: 1.45;
    }

    .back-cover__panel {
      justify-content: center;
      text-align: center;
      gap: 6mm;
    }

    .back-cover__panel h2 {
      margin: 0;
      font-size: 18pt;
      color: var(--blue-dark);
    }

    .back-cover__panel p {
      margin: 0;
      text-align: center;
      color: var(--muted);
    }

    .back-cover__quote {
      margin-top: 8mm;
      font-size: 11pt;
      font-style: italic;
      color: var(--blue-mid);
    }

    @media print {
      a { color: inherit; text-decoration: none; }
    }
  </style>
</head>
<body>
  <div class="doc">
    <!-- CAPA -->
    <section class="cover">
      <div class="cover__strip-top" aria-hidden="true"></div>
      <div class="cover__strip-bottom" aria-hidden="true"></div>
      <div class="cover__panel">
        <p class="cover__inst">Instituto Superior Politécnico de Tecnologias e Ciências</p>
        <p class="cover__course">Licenciatura em Engenharia Informática · 3.º Ano</p>
        <p class="cover__course">Disciplina: AW — Aplicações Web</p>
        <div class="cover__main">
          <span class="cover__tag">Relatório de projecto</span>
          <h1>NzolaNet</h1>
          <p class="cover__subtitle">
            Aplicação Web de rede social para publicação de conteúdos, interacção entre
            utilizadores, gestão de perfis e administração da plataforma.
          </p>
        </div>
        <table class="cover__meta">
          <tr><th>Professor</th><td>Sediangani Sofrimento</td></tr>
          <tr><th>Data de entrega</th><td>${escapeHtml(today)}</td></tr>
          <tr><th>Ano lectivo</th><td>${year} / ${year + 1}</td></tr>
          <tr><th>Elementos do grupo</th><td>${buildCoverMembersList()}</td></tr>
        </table>
      </div>
    </section>

    <!-- ÍNDICE -->
    <section class="page-break">
      <h2 class="toc-title">Índice</h2>
      <ol class="toc">${buildTocHtml()}</ol>
    </section>

    <!-- CONTEÚDO -->
    <div class="content">
      <section id="introducao" class="page-break">
        <h2 class="section-title">1. Introdução</h2>
        <p>
          O presente relatório descreve o projecto <strong>NzolaNet</strong>, desenvolvido no
          âmbito da cadeira de <strong>Aplicações Web (AW)</strong>, no 3.º ano da Licenciatura
          em Engenharia Informática do ISPTEC. A aplicação foi concebida como uma rede social
          que permite aos utilizadores publicar conteúdos, interagir através de bazes e
          comentários, gerir o perfil pessoal e acompanhar a actividade de outros membros
          da plataforma.
        </p>
        <p>
          O enunciado do projecto define requisitos funcionais, não funcionais e técnicos.
          O grupo optou pelas tecnologias <strong>Angular</strong> no frontend,
          <strong>ASP.NET Web API</strong> no backend e <strong>SQL Server</strong> como
          sistema de gestão de base de dados. Para além do pedido base, foram implementadas
          funcionalidades complementares, como mensagens privadas, assistente Fimbu e painel
          administrativo.
        </p>
      </section>

      <section id="contexto">
        <h2 class="section-title">2. Contexto e enunciado do projecto</h2>
        <p>
          As redes sociais são hoje ferramentas essenciais de comunicação digital. O enunciado
          do projecto propõe o desenvolvimento de uma aplicação web — a NzolaNet — que permita
          publicação de conteúdos, interacção entre utilizadores e manutenção de perfis pessoais.
        </p>
        <p>O sistema deve cobrir, no mínimo, os seguintes domínios:</p>
        <ul>
          <li>Gestão de utilizadores (registo, perfil, seguir/deixar de seguir);</li>
          <li>Gestão de publicações (criar, editar, eliminar, texto, imagem e vídeo);</li>
          <li>Bazes (like) com regra de um baze por utilizador por publicação;</li>
          <li>Comentários (criar, editar, eliminar e listar);</li>
          <li>Feed de notícias (publicações recentes e de utilizadores seguidos);</li>
          <li>Notificações (baze, comentário e novo seguidor).</li>
        </ul>
        <p>
          O enunciado também estabelece regras de negócio importantes: apenas utilizadores
          autenticados publicam conteúdos; cada utilizador só edita ou elimina o que lhe
          pertence; comentários ofensivos podem ser removidos pelo administrador; e os perfis
          podem ser públicos ou privados.
        </p>
      </section>

      <section id="grupo">
        <h2 class="section-title">3. Identificação do grupo</h2>
        <p>O projecto foi realizado por um grupo de quatro elementos, conforme exigido no enunciado:</p>
        <table>
          <thead>
            <tr><th>Nome</th><th>N.º de estudante</th><th>Área de contribuição</th></tr>
          </thead>
          <tbody>${buildMembersTableRows()}</tbody>
        </table>
      </section>

      <section id="objectivos">
        <h2 class="section-title">4. Objectivos</h2>
        <h3>4.1. Objectivo geral</h3>
        <p>
          Desenvolver uma aplicação web completa de rede social, funcional, segura e responsiva,
          que cumpra os requisitos do enunciado e demonstre competências de engenharia de software
          aplicadas a projectos web.
        </p>
        <h3>4.2. Objectivos específicos</h3>
        <ul>
          <li>Implementar autenticação, gestão de perfis e publicações multimédia;</li>
          <li>Garantir interacções sociais (bazes, comentários, notificações e feed);</li>
          <li>Aplicar arquitectura em camadas com DTOs entre frontend e backend;</li>
          <li>Assegurar usabilidade em desktop e dispositivos móveis;</li>
          <li>Disponibilizar ferramentas de administração e moderação de conteúdos.</li>
        </ul>
      </section>

      <section id="tecnologias">
        <h2 class="section-title">5. Tecnologias escolhidas</h2>
        <p>
          De entre as opções indicadas no enunciado, o grupo seleccionou explicitamente
          <strong>Angular</strong>, <strong>ASP.NET Web API</strong> e <strong>SQL Server</strong>.
          Não foram adoptadas as alternativas PHP/Laravel, MySQL ou PostgreSQL.
        </p>
        <table>
          <thead>
            <tr><th>Camada</th><th>Tecnologia</th><th>Justificação</th></tr>
          </thead>
          <tbody>
            <tr>
              <td>Frontend</td>
              <td>Angular (TypeScript, SCSS)</td>
              <td>SPA moderna, componentes reutilizáveis, rotas lazy-loaded e boa organização para interfaces complexas.</td>
            </tr>
            <tr>
              <td>Backend</td>
              <td>ASP.NET Web API (.NET)</td>
              <td>API REST robusta, integração com Identity, JWT, Entity Framework e SignalR.</td>
            </tr>
            <tr>
              <td>Base de dados</td>
              <td>SQL Server</td>
              <td>Persistência relacional fiável, adequada ao modelo de utilizadores, publicações, comentários e notificações.</td>
            </tr>
            <tr>
              <td>Comunicação</td>
              <td>REST + SignalR</td>
              <td>Pedidos HTTP para operações CRUD e tempo real para chat e métricas administrativas.</td>
            </tr>
            <tr>
              <td>Autenticação</td>
              <td>JWT (JSON Web Token)</td>
              <td>Sessão stateless, protecção de endpoints e uploads autenticados.</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section id="arquitectura">
        <h2 class="section-title">6. Arquitectura da solução</h2>
        <p>
          A NzolaNet segue uma arquitectura cliente-servidor com separação em camadas, conforme
          exigido no enunciado. O frontend Angular consome endpoints REST expostos pela API.
          O backend organiza-se em Domain, Application, Infrastructure e Api, usando repositórios,
          serviços, controllers e DTOs para transportar dados entre camadas.
        </p>
        <h3>6.1. Fluxo geral</h3>
        <ol>
          <li>O utilizador interage com a interface Angular;</li>
          <li>O frontend envia pedidos HTTP autenticados para a Web API;</li>
          <li>Os serviços aplicam regras de negócio e acedem aos repositórios;</li>
          <li>O Entity Framework Core persiste ou consulta dados no SQL Server;</li>
          <li>Ficheiros multimédia são guardados no servidor e servidos com controlo de acesso.</li>
        </ol>
        <h3>6.2. Organização do repositório</h3>
        <ul>
          <li><strong>frontend/</strong> — SPA Angular (páginas, serviços, componentes partilhados);</li>
          <li><strong>backend/NzolaNet.Api</strong> — controllers, middleware e configuração;</li>
          <li><strong>backend/NzolaNet.Application</strong> — serviços e DTOs;</li>
          <li><strong>backend/NzolaNet.Infrastructure</strong> — EF Core, repositórios e Identity;</li>
          <li><strong>backend/NzolaNet.Domain</strong> — entidades e interfaces.</li>
        </ul>
      </section>

      <section id="o-que-faz">
        <h2 class="section-title">7. O que faz a aplicação</h2>
        <p>
          A NzolaNet funciona como uma plataforma social onde cada utilizador possui conta,
          perfil e histórico de actividade. Após autenticação, pode criar publicações com texto,
          imagem ou vídeo, reagir a conteúdos de terceiros, comentar, seguir outros perfis e
          receber notificações das interacções.
        </p>
        <p>
          O feed apresenta publicações recentes e conteúdos de utilizadores seguidos, respeitando
          regras de privacidade. Perfis privados exigem aprovação antes de permitir acesso ao
          conteúdo. O administrador dispõe de um painel para acompanhar métricas, analisar
          gráficos e moderar publicações ou comentários denunciados.
        </p>
        <p>
          Em termos práticos, a aplicação substitui o fluxo básico de uma rede social académica:
          registo → publicação → interacção → notificação → gestão de perfil.
        </p>
      </section>

      <section id="funcionalidades">
        <h2 class="section-title">8. Funcionalidades implementadas (enunciado)</h2>
        <table>
          <thead>
            <tr><th>Requisito do enunciado</th><th>Implementação na NzolaNet</th></tr>
          </thead>
          <tbody>
            <tr><td>Registo de utilizadores</td><td>Formulário de registo com validação de email e username únicos.</td></tr>
            <tr><td>Recuperação de senha</td><td>Interface implementada; fluxo completo por email ainda não integrado.</td></tr>
            <tr><td>Edição de perfil e foto</td><td>Bio, foto de perfil, foto de capa e definições de privacidade.</td></tr>
            <tr><td>Seguir / deixar de seguir</td><td>Seguimento directo em perfis públicos; pedido de aprovação em perfis privados.</td></tr>
            <tr><td>Criar, editar e eliminar publicações</td><td>CRUD completo para o autor, com suporte a texto, imagem e vídeo.</td></tr>
            <tr><td>Bazes</td><td>Toggle de baze com contador; impede múltiplos bazes do mesmo utilizador.</td></tr>
            <tr><td>Comentários</td><td>Criar, editar, eliminar e listar comentários por publicação.</td></tr>
            <tr><td>Feed cronológico</td><td>Feed «Para ti» e «A seguir», com paginação e actualização dinâmica.</td></tr>
            <tr><td>Notificações</td><td>Baze, comentário, seguidor, pedido de seguimento e outras acções sociais.</td></tr>
            <tr><td>Moderação administrativa</td><td>Remoção de comentários e publicações denunciados pelo administrador.</td></tr>
          </tbody>
        </table>
      </section>

      <section id="funcionalidades-extra">
        <h2 class="section-title">9. Funcionalidades adicionais</h2>
        <p>Para além do enunciado mínimo, o grupo implementou:</p>
        <ul>
          <li><strong>Mensagens privadas</strong> — conversas entre utilizadores com texto, áudio, imagem, vídeo e reacções;</li>
          <li><strong>Fimbu</strong> — assistente de IA integrado com histórico de conversa;</li>
          <li><strong>Repartilhas e bookmarks</strong> — republicar publicações e guardar favoritos;</li>
          <li><strong>Pesquisa</strong> — encontrar utilizadores e publicações;</li>
          <li><strong>Tendências</strong> — hashtags mais usadas no painel lateral;</li>
          <li><strong>Painel administrativo</strong> — indicadores, gráficos, rankings e gestão de utilizadores;</li>
          <li><strong>Temas claro/escuro</strong> — melhoria de conforto visual;</li>
          <li><strong>Testes E2E</strong> — suite Playwright para desktop e mobile.</li>
        </ul>
      </section>

      <section id="nao-faz">
        <h2 class="section-title">10. O que a aplicação não faz</h2>
        <p>É importante distinguir o âmbito efectivo do projecto:</p>
        <ul>
          <li><strong>Recuperação de palavra-passe por email</strong> — a interface existe, mas o envio automático de email não está integrado no backend;</li>
          <li><strong>Não é um clone comercial</strong> — não replica todas as funcionalidades de redes sociais como X/Twitter ou Instagram;</li>
          <li><strong>Sem aplicação móvel nativa</strong> — trata-se de aplicação web responsiva, não de apps Android/iOS dedicadas;</li>
          <li><strong>Fimbu depende de APIs externas</strong> — requer chaves de modelos de linguagem configuradas no servidor;</li>
          <li><strong>Moderação manual</strong> — não existe filtragem automática de conteúdo ofensivo por IA; a moderação é feita pelo administrador.</li>
        </ul>
      </section>

      <section id="requisitos-nf">
        <h2 class="section-title">11. Requisitos não funcionais</h2>
        <table>
          <thead>
            <tr><th>Requisito</th><th>Como foi tratado</th></tr>
          </thead>
          <tbody>
            <tr><td>Interface responsiva</td><td>Layout adaptável com sidebar, bottom navigation e breakpoints para mobile.</td></tr>
            <tr><td>Segurança na autenticação</td><td>JWT, ASP.NET Identity, guards no frontend e uploads protegidos.</td></tr>
            <tr><td>Protecção de acessos</td><td>Autorização por roles (User/Admin) e regras de privacidade de media.</td></tr>
            <tr><td>Performance</td><td>Paginação do feed, lazy loading de rotas e carregamento incremental.</td></tr>
            <tr><td>Compatibilidade mobile</td><td>Testes E2E em viewport mobile e ajustes de touch targets.</td></tr>
            <tr><td>Usabilidade</td><td>Feedback visual, skeleton loading, modais acessíveis e navegação clara.</td></tr>
          </tbody>
        </table>
      </section>

      <section id="desafios">
        <h2 class="section-title">12. Desafios encontrados</h2>
        <p>Durante o desenvolvimento, o grupo enfrentou diversos desafios técnicos e de integração:</p>
        <ul>
          <li><strong>Sincronização frontend/backend</strong> — alinhar DTOs, estados locais e actualizações do feed após acções como baze ou repartilha;</li>
          <li><strong>Privacidade de perfis</strong> — garantir que publicações e media de perfis privados só são visíveis a seguidores aprovados;</li>
          <li><strong>Tempo real</strong> — implementar SignalR para chat e métricas administrativas sem inconsistências de estado;</li>
          <li><strong>Uploads multimédia</strong> — servir ficheiros com autenticação, tipos MIME correctos e regras de acesso;</li>
          <li><strong>Responsividade</strong> — manter usabilidade em desktop e mobile sem duplicar lógica de negócio;</li>
          <li><strong>Fimbu</strong> — construir prompts, validar respostas e evitar texto corrompido ou em idioma incorrecto;</li>
          <li><strong>Integridade de dados</strong> — respeitar foreign keys ao eliminar utilizadores, publicações e conversas de teste.</li>
        </ul>
      </section>

      <section id="vantagens">
        <h2 class="section-title">13. Vantagens da solução</h2>
        <ul>
          <li><strong>Stack coerente e moderna</strong> — Angular + ASP.NET Web API + SQL Server, alinhada ao enunciado;</li>
          <li><strong>Arquitectura escalável</strong> — separação em camadas facilita manutenção e evolução;</li>
          <li><strong>Experiência completa</strong> — vai além do mínimo com mensagens, IA, admin e pesquisa;</li>
          <li><strong>Segurança</strong> — autenticação JWT, roles, media protegida e moderação administrativa;</li>
          <li><strong>Usabilidade</strong> — interface responsiva, temas e feedback visual consistente;</li>
          <li><strong>Qualidade</strong> — testes E2E automatizados e documentação técnica no repositório.</li>
        </ul>
      </section>

      <section id="capturas" class="page-break">
        <h2 class="section-title">14. Capturas de ecrã</h2>
        <p>
          As figuras seguintes ilustram a aplicação em ambiente local, com sessão iniciada
          pelo utilizador <strong>will@gmail.com</strong>, incluindo feed, pesquisa, mensagens,
          Fimbu, perfil, definições, modo escuro e painel administrativo.
        </p>
        <div class="figures">${buildFigureHtml()}</div>
      </section>

      <section id="conclusao">
        <h2 class="section-title">15. Conclusão</h2>
        <p>
          A NzolaNet cumpre os requisitos funcionais e técnicos definidos no enunciado do projecto
          de Aplicações Web, utilizando Angular, ASP.NET Web API e SQL Server. A aplicação
          disponibiliza uma experiência social completa — publicações, bazes, comentários, feed,
          notificações e gestão de perfis — e acrescenta valor com mensagens privadas, assistente
          Fimbu e painel administrativo.
        </p>
        <p>
          O projecto consolidou competências de engenharia informática aplicadas ao desenvolvimento
          web: arquitectura em camadas, APIs REST, persistência relacional, autenticação, UX
          responsiva e trabalho em equipa. As dificuldades encontradas — especialmente em tempo
          real, privacidade e integração multimédia — foram superadas com iteração, testes e
          refactorização do código.
        </p>
        <p>
          Conclui-se que a NzolaNet constitui uma entrega adequada para avaliação na cadeira de AW,
          demonstrando tanto o cumprimento do enunciado como a capacidade de ir além do pedido
          mínimo com funcionalidades úteis e bem integradas.
        </p>
      </section>
    </div>

    <!-- CONTRA-CAPA -->
    <section class="back-cover">
      <div class="cover__strip-top" aria-hidden="true"></div>
      <div class="cover__strip-bottom" aria-hidden="true"></div>
      <div class="back-cover__panel">
        <h2>NzolaNet</h2>
        <p>Relatório de Projecto · AW — Aplicações Web</p>
        <p>Licenciatura em Engenharia Informática · 3.º Ano</p>
        <p>ISPTEC · ${escapeHtml(today)}</p>
        <p class="back-cover__quote">May The Code Be With You</p>
      </div>
    </section>
  </div>
</body>
</html>`
}

async function writeReportFiles(browser) {
  const html = buildReportHtml()
  await writeFile(htmlPath, html, 'utf8')

  const page = await browser.newPage()
  await page.goto(pathToFileURL(htmlPath).href, { waitUntil: 'networkidle' })
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    preferCSSPageSize: true,
    margin: { top: '0', right: '0', bottom: '0', left: '0' }
  })
  await page.close()
}

async function waitForServer(url, attempts = 30) {
  for (let i = 0; i < attempts; i += 1) {
    try {
      const response = await fetch(url)
      if (response.ok || response.status === 404) return true
    } catch {
      // servidor ainda não disponível
    }
    await new Promise(resolve => setTimeout(resolve, 2000))
  }
  return false
}

async function main() {
  await ensureDirectories()

  const adminOnly = process.argv.includes('--admin-only')
  const forceCapture = process.argv.includes('--capture') || process.argv.includes('--resume-capture')
  const skipCapture = process.argv.includes('--skip-capture') || (!forceCapture && screenshotsExist())

  if (!skipCapture) {
    console.log('A iniciar capturas — certifica-te de que backend (:5000) e frontend (:4200) estão activos.')
    const frontendReady = await waitForServer(`${baseUrl}/login`)
    if (!frontendReady) {
      throw new Error('Frontend não disponível em http://localhost:4200. Inicia backend e frontend antes de gerar o relatório.')
    }
  }

  const browser = await chromium.launch({ headless: true })

  try {
    if (!skipCapture) {
      if (!adminOnly) {
        await captureMainAppScreenshots(browser)
      }
      await captureAdminScreenshots(browser)
    } else {
      console.log('A reutilizar capturas existentes em docs/report-assets/')
    }

    await writeReportFiles(browser)
  } finally {
    await browser.close()
  }

  console.log(`Relatório HTML: ${htmlPath}`)
  console.log(`Relatório PDF: ${pdfPath}`)
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
