import { Component, NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, RouterOutlet } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { NEVER, of } from 'rxjs';
import posthog from 'posthog-js';
import { AppComponent } from './app.component';
import {
  AuthService,
  LangService,
  LoadingService,
  ShowErrorService,
  ThemeService,
  VisitTrackingService,
} from './services';
import { BlogMaintenanceService } from './services/blog-maintenance.service';

@Component({ standalone: true, template: '<p>Note content</p>' })
class ContentPageComponent {}

describe('Published note application layout', () => {
  it('shows only routed content for a shared note and restores the blog shell when leaving', async () => {
    spyOn(posthog, 'capture').and.stub();
    TestBed.configureTestingModule({
      imports: [AppComponent, TranslateModule.forRoot()],
      providers: [
        provideRouter([
          { path: 'shared-note/:token', component: ContentPageComponent },
          { path: '', component: ContentPageComponent },
        ]),
        {
          provide: AuthService,
          useValue: {
            getToken: () => 'test',
            isLoggedIn: () => true,
            hasPermission: () => true,
            tryRefreshOnInit: () => undefined,
          },
        },
        { provide: LangService, useValue: { getLang: () => 'vi' } },
        { provide: LoadingService, useValue: { getLoading: () => of(false) } },
        { provide: ShowErrorService, useValue: { getErrorInfo: () => NEVER } },
        { provide: VisitTrackingService, useValue: { init: () => undefined } },
        {
          provide: ThemeService,
          useValue: { init: () => undefined, applyForLayout: () => undefined },
        },
        {
          provide: BlogMaintenanceService,
          useValue: { startMonitoring: () => undefined },
        },
      ],
    });
    // Keep the actual shell template and routing; unrelated children are inert.
    TestBed.overrideComponent(AppComponent, {
      set: {
        imports: [CommonModule, RouterOutlet],
        schemas: [NO_ERRORS_SCHEMA],
      },
    });
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/shared-note/' + 'a'.repeat(64));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.componentInstance.layoutType).toBe('immersive');
    expect(fixture.nativeElement.textContent).toContain('Note content');
    expect(
      fixture.nativeElement.querySelector(
        'app-navbar, app-footer, app-chat-widget, app-personal-notes-widget'
      )
    ).toBeNull();
    await router.navigateByUrl('/');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.componentInstance.layoutType).toBe('user');
    expect(fixture.nativeElement.querySelector('app-navbar')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('app-footer')).not.toBeNull();
    fixture.destroy();
  });
});
