/**
 * Opcional — só necessário se expuseres também a API via ngrok (ex.: teste no telemóvel).
 *
 * Fluxo simples (backend local, frontend via ngrok no mesmo PC):
 *   npm start  →  ngrok http 4200  →  dotnet run
 * Usa environment.ts (localhost:5000) — não precisas deste ficheiro.
 */
export const environment = {
  production: false,
  apiUrl: 'https://SUBSTITUIR-API.ngrok-free.dev/api',
  uploadsUrl: 'https://SUBSTITUIR-API.ngrok-free.dev'
};
