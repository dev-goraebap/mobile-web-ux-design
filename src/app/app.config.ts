import {
  ApplicationConfig,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { requestPersistentStorage } from '@/shared/api';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    // 시작 시 영속 저장소를 요청한다(실패해도 앱은 계속 뜬다).
    provideAppInitializer(() => {
      void requestPersistentStorage();
    }),
  ],
};
