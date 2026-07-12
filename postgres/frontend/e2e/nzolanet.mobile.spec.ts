import { test, expect } from '@playwright/test';

test.describe('NzolaNet — Mobile (viewport ≤412px)', () => {

  test('1. Login mobile sem overflow horizontal', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('.auth-form__title')).toBeVisible();

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
  });

  test('2. Bottom nav visível após login', async ({ page }) => {
    await fazerLogin(page);

    const bottomNav = page.locator('.sidebar__mobile');
    await expect(bottomNav).toBeVisible();
    await expect(bottomNav).toHaveAttribute('aria-label', 'Navegação mobile');
  });

  test('3. Topbar visível no feed mobile', async ({ page }) => {
    await fazerLogin(page);
    await expect(page.locator('app-topbar')).toBeVisible();
  });

  test('4. Navegação bottom bar — pesquisa e notificações', async ({ page }) => {
    await fazerLogin(page);

    await page.locator('.sidebar__mobile a[aria-label="Pesquisar"]').click();
    await page.waitForURL('**/search', { timeout: 10000 });
    await expect(page.locator('app-search-page, .search-page').first()).toBeVisible();

    await page.locator('.sidebar__mobile a[aria-label="Notificações"]').click();
    await page.waitForURL('**/notifications', { timeout: 10000 });
    await expect(page.locator('app-notifications-page, .notifications-page').first()).toBeVisible();

    await page.locator('.sidebar__mobile a[aria-label="Início"]').click();
    await page.waitForURL('**/feed', { timeout: 10000 });
    await expect(page.locator('.sidebar__mobile-link--active[aria-label="Início"]')).toBeVisible();
  });

  test('5. Botão publicar abre modal sheet', async ({ page }) => {
    await fazerLogin(page);

    await page.locator('.sidebar__mobile-publish').click();
    const dialog = page.locator('.modal__dialog');
    await expect(dialog).toBeVisible({ timeout: 8000 });
    await expect(dialog.locator('.modal__title')).toHaveText('Criar publicação');
    await expect(dialog.locator('app-create-post')).toBeVisible();
  });

  test('6. Feed carrega publicações sem overflow horizontal', async ({ page }) => {
    await fazerLogin(page);

    await expect(page.locator('app-publication-card').first()).toBeVisible({ timeout: 10000 });

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
  });

  test('7. Baze dispara feedback visual no mobile', async ({ page }) => {
    await fazerLogin(page);

    const likeButton = page.locator('button.publication-card__action--like').first();
    await expect(likeButton).toBeVisible({ timeout: 10000 });
    await likeButton.scrollIntoViewIfNeeded();

    const estadoInicial = await likeButton.getAttribute('aria-pressed');
    await likeButton.click();
    await expect(likeButton).toHaveAttribute(
      'aria-pressed',
      estadoInicial === 'true' ? 'false' : 'true',
      { timeout: 10000 }
    );
  });

  test('8. Perfil acessível pela bottom nav', async ({ page }) => {
    await fazerLogin(page);

    await page.locator('.sidebar__mobile a[aria-label="Perfil"]').click();
    await page.waitForURL('**/profile/**', { timeout: 10000 });
    await expect(page.locator('app-profile-page, .profile-page').first()).toBeVisible();
  });

  test('9. Credenciais inválidas mostram erro no mobile', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#login-email', 'invalido@demo.com');
    await page.fill('#login-password', 'errada');
    await page.click('button[type="submit"]');

    await expect(page.locator('.auth-form__error')).toBeVisible({ timeout: 8000 });
  });
});

async function fazerLogin(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('/login');
  await page.fill('#login-email', 'demo@demo.com');
  await page.fill('#login-password', 'senha123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/feed', { timeout: 10000 });
}
