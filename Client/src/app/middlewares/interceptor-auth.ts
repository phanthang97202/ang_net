import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { Provider } from '@angular/core';
import { AuthInterceptor } from '../services';

/** Provider for the Noop Interceptor. */
/*
  There are 2 ways to be configuration interceptor reading more here => 
    https://v17.angular.io/guide/http-intercept-requests-and-responses
    https://dev.to/bytebantz/angulars-17-interceptors-complete-tutorial-220k
*/
export const authInterceptorProvider: Provider = {
  provide: HTTP_INTERCEPTORS,
  useClass: AuthInterceptor,
  multi: true,
};
