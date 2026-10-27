import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of } from 'rxjs';
import { routes } from '../app.routes';
import {
  BlogMaintenanceService,
  shiftReportOnlyRedirect,
} from '../services/blog-maintenance.service';

@Component({ standalone: true, template: '' })
class Page {}

describe('Maintenance route redirects', () => {
  let enabled: boolean;
  let shiftOnly: boolean;
  let loggedIn: boolean;
  let canUseShiftReport: boolean;
  beforeEach(() => {
    enabled = true;
    shiftOnly = false;
    loggedIn = false;
    canUseShiftReport = false;
    // Preserve production paths/guards, replacing feature components and auth guards.
    const testRoutes = routes.map(route => {
      const { loadComponent, children, canActivate, ...rest } = route;
      if (route.redirectTo !== undefined) return rest;
      return {
        ...rest,
        component: Page,
        children:
          route.path === 'dashboard' || route.path === 'tools'
            ? [{ path: '**', component: Page }]
            : undefined,
      };
    });
    TestBed.configureTestingModule({
      providers: [
        provideRouter(testRoutes),
        {
          provide: BlogMaintenanceService,
          useValue: {
            check: () => of(enabled),
            checkShiftReportOnly: () => of(shiftOnly),
            shiftReportOnlyRedirect: (url: string) =>
              shiftReportOnlyRedirect(url, loggedIn, canUseShiftReport),
          },
        },
      ],
    });
  });
  const expectUrls = async (
    harness: RouterTestingHarness,
    paths: string[],
    expected?: string
  ) => {
    for (const path of paths) {
      await harness.navigateByUrl(path);
      expect(TestBed.inject(Router).url)
        .withContext(path)
        .toBe(expected ?? path);
    }
  };
  it('redirects home, protected modules, login and unknown URLs while allowing dashboard and maintain', async () => {
    const harness = await RouterTestingHarness.create();
    await expectUrls(
      harness,
      [
        '/',
        '/news/a/b',
        '/tools/shift-report',
        '/login',
        '/unknown',
        '/dashboard-other',
      ],
      '/maintain'
    );
    await expectUrls(harness, [
      '/dashboard/users',
      '/dashboard',
      '/dashboard/login',
      '/maintain?x=1',
    ]);
  });
  it('lets retry return to home after maintenance is disabled', async () => {
    const harness = await RouterTestingHarness.create('/maintain');
    enabled = false;
    await expectUrls(harness, ['/', '/news/a/b']);
  });
  it('sends every blog URL to the shift report when ONLY_SHIFT_REPORT is on, except login and dashboard', async () => {
    enabled = false;
    shiftOnly = true;
    const harness = await RouterTestingHarness.create();
    await expectUrls(
      harness,
      [
        '/',
        '/news/a/b',
        '/music',
        '/tools/rental-statistics',
        '/unknown',
        '/reels',
      ],
      '/tools/shift-report'
    );
    await expectUrls(harness, [
      '/tools/shift-report',
      '/login',
      '/forgot-password',
      '/dashboard',
      '/dashboard/users',
      '/dashboard/login',
    ]);
    loggedIn = true;
    canUseShiftReport = true;
    await expectUrls(harness, ['/', '/phim'], '/tools/shift-report');
    await expectUrls(harness, ['/tools/shift-report']);
  });
  it('shows maintenance to signed-in users who cannot use the shift report, instead of looping', async () => {
    enabled = false;
    shiftOnly = true;
    loggedIn = true;
    const harness = await RouterTestingHarness.create();
    await expectUrls(harness, ['/', '/tools/shift-report'], '/maintain');
    await expectUrls(harness, ['/login', '/dashboard']);
  });
  it('lets maintenance win over shift-report-only mode', async () => {
    shiftOnly = true;
    const harness = await RouterTestingHarness.create();
    await expectUrls(harness, ['/', '/tools/shift-report'], '/maintain');
  });
});
