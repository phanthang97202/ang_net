import { Injectable, NgZone } from '@angular/core';
import posthog from 'posthog-js';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PostHogSessionRecordingService {
  constructor(private ngZone: NgZone) {}
  initPostHog() {
    this.ngZone.runOutsideAngular(() => {
      posthog.init(environment.POSTHOG_KEY, {
        api_host: environment.POSTHOG_HOST,
        person_profiles: 'always', // or 'always' to create profiles for anonymous users as well,
        capture_pageview: false, // To start, we need to add capture_pageview: false to the PostHog initialization to avoid double capturing the first pageview.
      });
    });
  }
}
