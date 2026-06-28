/**
 * Copia este ficheiro para `environment.ngrok.ts` e preenche os URLs dos túneis ngrok.
 *
 * 1. ngrok http 4200   → URL do frontend (browser)
 * 2. ngrok http 5000   → URL da API (apiUrl / uploadsUrl)
 * 3. npm run start:ngrok
 * 4. Na API, define CORS_EXTRA_ORIGINS com o URL do frontend ngrok (ver appsettings.json).
 */
export const environment = {
  production: false,
  apiUrl: 'https://SUBSTITUIR-API.ngrok-free.dev/api',
  uploadsUrl: 'https://SUBSTITUIR-API.ngrok-free.dev'
};
