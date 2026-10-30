import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, NO_ERRORS_SCHEMA, Output } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, RouterOutlet } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { NEVER, of } from 'rxjs';
import posthog from 'posthog-js';
import { AppComponent } from './app.component';
import { AuthService, LangService, LoadingService, ShowErrorService, ThemeService } from './services';
import { BlogMaintenanceService } from './services/blog-maintenance.service';
import { WebAnalyticsTrackingService } from './services/web-analytics.service';

@Component({ selector: 'app-music', standalone: true, template: '<iframe title="player"></iframe>' })
class MusicStub { @Input() mini = false; @Output() closeMini = new EventEmitter<void>(); }
@Component({ standalone: true, template: '<p>Page</p>' })
class PageStub {}

describe('Persistent music shell', () => {
  it('keeps the player mounted while changing pages and closes it on request', async () => {
    spyOn(posthog, 'capture').and.stub();
    TestBed.configureTestingModule({ imports: [AppComponent, TranslateModule.forRoot()], providers: [
      provideRouter([{ path: 'music', component: PageStub }, { path: 'other', component: PageStub }]),
      { provide: AuthService, useValue: { getToken: () => 'test', isLoggedIn: () => true, hasPermission: () => true, tryRefreshOnInit: () => {} } },
      { provide: LangService, useValue: { getLang: () => 'vi' } },
      { provide: LoadingService, useValue: { getLoading: () => of(false) } },
      { provide: ShowErrorService, useValue: { getErrorInfo: () => NEVER } },
      { provide: ThemeService, useValue: { init: () => {}, applyForLayout: () => {} } },
      { provide: BlogMaintenanceService, useValue: { startMonitoring: () => {} } },
      { provide: WebAnalyticsTrackingService, useValue: { init: () => {} } },
    ] });
    TestBed.overrideComponent(AppComponent, { set: { imports: [CommonModule, RouterOutlet, MusicStub], schemas: [NO_ERRORS_SCHEMA] } });
    const fixture = TestBed.createComponent(AppComponent); fixture.detectChanges();
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/music'); fixture.detectChanges(); await fixture.whenStable(); fixture.detectChanges();
    const player = fixture.nativeElement.querySelector('app-music');
    expect(player).not.toBeNull(); const frame = player.querySelector('iframe');
    await router.navigateByUrl('/other'); fixture.detectChanges(); await fixture.whenStable(); fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-music')).toBe(player);
    expect(player.querySelector('iframe')).toBe(frame);
    expect(fixture.componentInstance.musicPageActive).toBeFalse();
    await router.navigateByUrl('/music'); fixture.detectChanges(); await fixture.whenStable(); fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-music')).toBe(player);
    fixture.componentInstance.musicStarted = false; fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-music')).toBeNull();
    fixture.destroy();
  });
});
