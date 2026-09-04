import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import {
  provideRouter,
  TitleStrategy,
  withInMemoryScrolling,
} from '@angular/router';
import { routes } from './app.routes';
import { AppTitleStrategy } from './services/app-title-strategy.service';
import { en_US, provideNzI18n } from 'ng-zorro-antd/i18n';
import { registerLocaleData } from '@angular/common';
import en from '@angular/common/locales/en';
import { FormsModule } from '@angular/forms';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { authInterceptorProvider } from './middlewares';
import { HttpClient } from '@angular/common/http';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';

// ----------localization------------------
export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}
registerLocaleData(en);

export const appConfig: ApplicationConfig = {
  providers: [
    // 'enabled': bấm Back/Forward thì khôi phục đúng vị trí cuộn cũ, còn điều
    // hướng mới thì lên đầu trang. Mặc định router không làm gì cả, nên back
    // từ bài viết về trang chủ là mất chỗ đang đọc dở.
    provideRouter(
      routes,
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled' })
    ),
    { provide: TitleStrategy, useClass: AppTitleStrategy },
    provideNzI18n(en_US),
    importProvidersFrom(FormsModule),
    provideAnimationsAsync(),
    // using interceptor with DI
    provideHttpClient(withInterceptorsFromDi()),
    authInterceptorProvider,
    // using interceptor with Fn
    // provideHttpClient(withInterceptors([authInterceptorProvider])),
    // config localization
    importProvidersFrom(
      TranslateModule.forRoot({
        defaultLanguage: 'en',
        loader: {
          provide: TranslateLoader,
          useFactory: createTranslateLoader,
          deps: [HttpClient],
        },
      })
    ),
  ],
};
