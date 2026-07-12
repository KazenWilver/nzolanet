/**
 * Configuração local ngrok — não versionar (ver environment.ngrok.example.ts).
 * Usa URLs relativas; o proxy.conf.json encaminha /api e /uploads para localhost:5000.
 */
export const environment = {
  production: false,
  apiUrl: '/api',
  uploadsUrl: ''
};
