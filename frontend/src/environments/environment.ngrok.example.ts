/**
 * Copia para `environment.ngrok.ts` se usares npm run start:ngrok.
 *
 * Com npm start + ngrok http 4200, basta environment.ts (URLs relativas).
 * O proxy.conf.json encaminha /api e /uploads para a API local em :5000.
 */
export const environment = {
  production: false,
  apiUrl: '/api',
  uploadsUrl: ''
};
