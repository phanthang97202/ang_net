import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import posthog from 'posthog-js';
import { environment } from './environments/environment';

// session replay--------------------
// posthog.init(environment.POSTHOG_KEY, {
//   api_host: environment.POSTHOG_HOST,
//   person_profiles: 'always', // or 'always' to create profiles for anonymous users as well,
//   capture_pageview: false, // To start, we need to add capture_pageview: false to the PostHog initialization to avoid double capturing the first pageview.
// });

bootstrapApplication(AppComponent, appConfig).catch(err => console.error(err));
