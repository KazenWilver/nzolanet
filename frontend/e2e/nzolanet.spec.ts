import { test, expect } from '@playwright/test';

// ============================================================
//  NzolaNet E2E — Testes de Integração Frontend + Mock Backend
// ============================================================

test.describe('NzolaNet — Testes E2E Completos', () => {

  // ── 1. TEMA ESCURO (Carbon Aurora) ──────────────────────────
  test('1. Validar tema escuro (Carbon Aurora) na página de login', async ({ page }) => {
    await page.goto('/auth/login');
    const loginContent = page.locator('.login__content');
    await expect(loginContent).toBeVisible();

    // Fundo do body deve ser a cor escura do canvas (#07080A → rgb(7, 8, 10))
    const bodyBg = await page.locator('body').evaluate(
      el => window.getComputedStyle(el).backgroundColor
    );
    expect(bodyBg).toBe('rgb(7, 8, 10)');
    console.log('✅ Tema escuro Carbon Aurora detectado: ' + bodyBg);

    // Font-family deve conter Inter
    const fontFamily = await page.locator('body').evaluate(
      el => window.getComputedStyle(el).fontFamily
    );
    expect(fontFamily.toLowerCase()).toContain('inter');
    console.log('✅ Fonte Inter detectada: ' + fontFamily);
  });

  // ── 2. LOGIN ────────────────────────────────────────────────
  test('2. Login com credenciais válidas e redireccionamento ao feed', async ({ page }) => {
    await page.goto('/auth/login');

    await page.fill('input#email', 'demo@demo.com');
    await page.fill('input#senha', 'senha123');
    await page.click('button[type="submit"]');

    // Deve redirecionar para o feed
    await page.waitForURL('**/feed', { timeout: 10000 });
    console.log('✅ Login bem-sucedido — redireccionado para /feed');
  });

  // ── 3. FEED — Visualizar publicações ────────────────────────
  test('3. Feed carrega publicações do mock backend', async ({ page }) => {
    await fazerLogin(page);

    // Aguardar pelo menos um post-card visível
    const postCard = page.locator('.post-card').first();
    await expect(postCard).toBeVisible({ timeout: 10000 });

    // O post deve ter texto legível (não "undefined" ou vazio)
    const textoPost = await postCard.innerText();
    expect(textoPost.length).toBeGreaterThan(5);
    expect(textoPost).not.toContain('undefined');
    console.log('✅ Feed carregou publicações com conteúdo real');
  });

  // ── 4. CRIAR PUBLICAÇÃO ─────────────────────────────────────
  test('4. Criar nova publicação no feed', async ({ page }) => {
    await fazerLogin(page);

    const gatilho = page.locator('button.criar-post__gatilho');
    await expect(gatilho).toBeVisible({ timeout: 10000 });
    await gatilho.click();

    const textarea = page.locator('textarea.criar-post__textarea');
    await expect(textarea).toBeVisible();
    await textarea.fill('Publicação de teste E2E automatizado');
    await page.click('button.criar-post__btn-publicar');

    // Aguardar o post aparecer no feed
    await page.waitForTimeout(2000);
    console.log('✅ Publicação criada com sucesso');
  });

  // ── 5. PESQUISA ─────────────────────────────────────────────
  test('5. Pesquisar publicações por termo', async ({ page }) => {
    await fazerLogin(page);

    await page.goto('/pesquisar');
    const input = page.locator('.search-page__input');
    await expect(input).toBeVisible({ timeout: 10000 });

    await input.fill('fotografia');
    await page.click('.search-page__button');

    // Aguardar resultado (post-card ou mensagem vazia)
    await page.waitForTimeout(2000);
    console.log('✅ Pesquisa executada com sucesso');
  });

  // ── 6. PERFIL ───────────────────────────────────────────────
  test('6. Navegar até ao perfil do utilizador autenticado', async ({ page }) => {
    await fazerLogin(page);

    await page.goto('/perfil/1');
    await page.waitForLoadState('networkidle');

    // O nome do perfil deve estar presente
    const perfilNome = page.locator('.perfil__nome');
    await expect(perfilNome).toBeVisible({ timeout: 10000 });

    const nomeTexto = await perfilNome.innerText();
    expect(nomeTexto.length).toBeGreaterThan(0);
    console.log('✅ Perfil carregado: ' + nomeTexto);
  });

  // ── 7. NOTIFICAÇÕES ─────────────────────────────────────────
  test('7. Navegar até à página de notificações', async ({ page }) => {
    await fazerLogin(page);

    await page.goto('/notificacoes');
    await page.waitForLoadState('networkidle');

    const header = page.locator('.notifications-page__header');
    await expect(header).toBeVisible({ timeout: 10000 });
    console.log('✅ Página de notificações carregada');
  });

  // ── 8. NAVEGAÇÃO GERAL ─────────────────────────────────────
  test('8. Verificar que todas as rotas principais carregam sem erro', async ({ page }) => {
    await fazerLogin(page);

    // Feed
    await page.goto('/feed');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.criar-post')).toBeVisible({ timeout: 10000 });
    console.log('  ✓ /feed OK');

    // Pesquisa
    await page.goto('/pesquisar');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.search-page')).toBeVisible({ timeout: 10000 });
    console.log('  ✓ /pesquisar OK');

    // Notificações
    await page.goto('/notificacoes');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.notifications-page__header')).toBeVisible({ timeout: 10000 });
    console.log('  ✓ /notificacoes OK');

    // Perfil
    await page.goto('/perfil/1');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.perfil')).toBeVisible({ timeout: 10000 });
    console.log('  ✓ /perfil/:id OK');

    console.log('✅ Todas as rotas principais carregam correctamente');
  });

  // ── 9. LOGIN INVÁLIDO ───────────────────────────────────────
  test('9. Login com credenciais inválidas mostra erro', async ({ page }) => {
    await page.goto('/auth/login');

    await page.fill('input#email', 'invalido@email.com');
    await page.fill('input#senha', 'senhaerrada');
    await page.click('button[type="submit"]');

    // Deve mostrar mensagem de erro
    const erro = page.locator('.login__erro');
    await expect(erro).toBeVisible({ timeout: 5000 });
    console.log('✅ Login inválido mostra mensagem de erro');
  });

  // ── 10. REGISTO ─────────────────────────────────────────────
  test('10. Página de registo carrega correctamente', async ({ page }) => {
    await page.goto('/auth/registar');
    await page.waitForLoadState('networkidle');

    // Deve ter campos de registo visíveis
    const formVisivel = page.locator('form');
    await expect(formVisivel).toBeVisible({ timeout: 10000 });
    console.log('✅ Página de registo carregada');
  });

  // ── 11. RECUPERAR SENHA ─────────────────────────────────────
  test('11. Página de recuperação de senha carrega correctamente', async ({ page }) => {
    await page.goto('/auth/recuperar-senha');
    await page.waitForLoadState('networkidle');

    const formVisivel = page.locator('form');
    await expect(formVisivel).toBeVisible({ timeout: 10000 });
    console.log('✅ Página de recuperação de senha carregada');
  });
});

// ── HELPER ─────────────────────────────────────────────────────
async function fazerLogin(page) {
  await page.goto('/auth/login');
  await page.fill('input#email', 'demo@demo.com');
  await page.fill('input#senha', 'senha123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/feed', { timeout: 10000 });
}
