/**
 * Produção (Vercel). Substitui as URLs pela API no Render após o deploy.
 * Exemplo: https://nzolanet-api.onrender.com
 */
export const environment = {
  production: true,
  apiUrl: 'https://YOUR-RENDER-API.onrender.com/api',
  uploadsUrl: 'https://YOUR-RENDER-API.onrender.com',
  chatHubUrl: 'https://YOUR-RENDER-API.onrender.com/hubs/chat',
  adminHubUrl: 'https://YOUR-RENDER-API.onrender.com/hubs/admin'
};
