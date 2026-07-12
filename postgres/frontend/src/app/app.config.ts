import { ApplicationConfig, APP_INITIALIZER, inject, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { jwtInterceptor } from './core/interceptors/jwt.interceptor';
import { ThemeService } from './core/services/theme.service';
import { LocaleService } from './core/i18n/locale.service';

function initTheme(): () => void {
  const themeService = inject(ThemeService);
  return () => themeService.initTheme();
}

function initLocale(): () => Promise<void> {
  const localeService = inject(LocaleService);
  return () => localeService.initialize();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([jwtInterceptor])),
    {
      provide: APP_INITIALIZER,
      useFactory: initTheme,
      multi: true
    },
    {
      provide: APP_INITIALIZER,
      useFactory: initLocale,
      multi: true
    }
  ]
};
