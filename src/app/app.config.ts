import { ApplicationConfig, LOCALE_ID, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { routes } from './app.routes';

// Os pipes de moeda e data usam pt-BR; sem os dados desse locale o Angular lança NG0701
// ao desenhar os cards e o restante da lista deixa de ser exibido.
registerLocaleData(localePt);

export const appConfig: ApplicationConfig = {
  providers: [
    // Sem zone.js: o Angular só redesenha quando um signal muda (ou um evento acontece).
    // Esta opção faz as respostas da API atualizarem a tela sem precisar de um clique.
    provideZonelessChangeDetection(),
    provideBrowserGlobalErrorListeners(),
    { provide: LOCALE_ID, useValue: 'pt-BR' },
    provideRouter(routes),
    provideHttpClient()
  ]
};