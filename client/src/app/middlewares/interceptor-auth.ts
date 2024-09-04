import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { Provider } from '@angular/core';
import { AuthInterceptor } from '../services/interceptor-auth.service';

/** Provider for the Noop Interceptor. */
// reading more here => https://v17.angular.io/guide/http-intercept-requests-and-responses
export const authInterceptorProvider: Provider = {
  provide: HTTP_INTERCEPTORS,
  useClass: AuthInterceptor,
  multi: true,
};
