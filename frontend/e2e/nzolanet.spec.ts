import { test, expect } from '@playwright/test';

// ============================================================
//  NzolaNet E2E — Testes de Integração Frontend + Mock Backend
// ============================================================

test.describe('NzolaNet — Testes E2E Completos', () => {

  test('1. Validar tema escuro (Carbon Aurora) na página de login', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('nzolanet_theme', 'dark');
    });
    await page.goto('/login');
    await expect(page.locator('.auth-form__title')).toBeVisible();

    const bodyBg = await page.locator('body').evaluate(
      el => window.getComputedStyle(el).backgroundColor
    );
    expect(bodyBg).toBe('rgb(0, 0, 0)');

    const fontFamily = await page.locator('body').evaluate(
      el => window.getComputedStyle(el).fontFamily
    );
    expect(fontFamily.toLowerCase()).toContain('inter');
  });

  test('2. Login com credenciais válidas e redireccionamento ao feed', async ({ page }) => {
    await page.goto('/login');

    await page.fill('#login-email', 'demo@demo.com');
    await page.fill('#login-password', 'senha123');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/feed', { timeout: 10000 });
  });

  test('3. Feed carrega publicações do mock backend', async ({ page }) => {
    await fazerLogin(page);

    const publicationCard = page.locator('app-publication-card').first();
    await expect(publicationCard).toBeVisible({ timeout: 10000 });

    const textoPost = await publicationCard.innerText();
    expect(textoPost.length).toBeGreaterThan(5);
    expect(textoPost).not.toContain('undefined');
  });

  test('4. Criar nova publicação no feed', async ({ page }) => {
    await fazerLogin(page);

    const gatilho = page.locator('button.create-publication__trigger');
    await expect(gatilho).toBeVisible({ timeout: 10000 });
    await gatilho.click();

    const textarea = page.locator('textarea.create-publication__textarea');
    await expect(textarea).toBeVisible();
    await textarea.fill(`Publicação E2E ${Date.now()}`);
    await page.click('button.create-publication__btn-publish');

    await expect(page.locator('app-publication-card').first()).toBeVisible({ timeout: 10000 });
  });

  test('5. Pesquisar utilizadores por termo', async ({ page }) => {
    await fazerLogin(page);

    await page.goto('/search');
    const input = page.locator('.search-page__input');
    await expect(input).toBeVisible({ timeout: 10000 });

    await input.fill('ana');
    await expect(page.locator('.search-page__results li').first()).toBeVisible({ timeout: 10000 });
  });

  test('6. Navegar até ao perfil do utilizador autenticado', async ({ page }) => {
    await fazerLogin(page);

    await page.goto('/profile/1');
    await page.waitForLoadState('networkidle');

    const perfilNome = page.locator('.profile-page__name');
    await expect(perfilNome).toBeVisible({ timeout: 10000 });
    await expect(perfilNome).toContainText('Demo');
  });

  test('7. Navegar até à página de notificações', async ({ page }) => {
    await fazerLogin(page);

    await page.goto('/notifications');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.page-header__title')).toHaveText('Notificações');
  });

  test('8. Verificar que todas as rotas principais carregam sem erro', async ({ page }) => {
    await fazerLogin(page);

    await page.goto('/feed');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('app-create-post')).toBeVisible({ timeout: 10000 });

    await page.goto('/search');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.search-page')).toBeVisible({ timeout: 10000 });

    await page.goto('/notifications');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.page-header__title')).toHaveText('Notificações');

    await page.goto('/profile/1');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.profile-page')).toBeVisible({ timeout: 10000 });
  });

  test('9. Login com credenciais inválidas mostra erro', async ({ page }) => {
    await page.goto('/login');

    await page.fill('#login-email', 'invalido@email.com');
    await page.fill('#login-password', 'senhaerrada');
    await page.click('button[type="submit"]');

    const erro = page.locator('.auth-form__error');
    await expect(erro).toBeVisible({ timeout: 5000 });
  });

  test('10. Página de registo carrega correctamente', async ({ page }) => {
    await page.goto('/register');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('form')).toBeVisible({ timeout: 10000 });
  });

  test('11. Página de recuperação de senha carrega correctamente', async ({ page }) => {
    await page.goto('/forgot-password');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('form')).toBeVisible({ timeout: 10000 });
  });

  test('12. Baze dispara feedback visual sem erro', async ({ page }) => {
    await fazerLogin(page);

    const likeButton = page.locator('button.publication-card__action--like').first();
    await expect(likeButton).toBeVisible({ timeout: 10000 });
    await likeButton.click();

    await expect(likeButton).toHaveAttribute('aria-pressed', 'true');
  });

  test('13. Notificação de mensagem aparece no centro de notificações', async ({ page }) => {
    await fazerLogin(page)

    await page.goto('/messages')
    await page.waitForLoadState('networkidle')

    const primeiraConversa = page.locator('.messages-page__list-item').first()
    await expect(primeiraConversa).toBeVisible({ timeout: 10000 })
    await primeiraConversa.click()

    const composer = page.locator('.messages-page__composer-input')
    await composer.fill('Mensagem e2e de notificação')
    await page.click('.messages-page__send-btn')

    await page.goto('/notifications')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('.notifications-page__message').first()).toContainText('enviou-te uma mensagem')
  })
});

async function fazerLogin(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('/login');
  await page.fill('#login-email', 'demo@demo.com');
  await page.fill('#login-password', 'senha123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/feed', { timeout: 10000 });
}
