/**
 * Copia para `environment.ngrok.ts` e preenche os URLs dos túneis ngrok.
 *
 * Fluxo simples (API local, frontend via ngrok no mesmo PC):
 *   npm start  →  ngrok http 4200  →  dotnet run
 *
 * Fluxo completo (API também via ngrok, ex.: telemóvel):
 *   1. ngrok http 4200  e  ngrok http 5000
 *   2. Preenche os URLs abaixo
 *   3. npm run start:ngrok
 */
export const environment = {
  production: false,
  apiUrl: 'https://SUBSTITUIR-API.ngrok-free.dev/api',
  uploadsUrl: 'https://SUBSTITUIR-API.ngrok-free.dev'
};
