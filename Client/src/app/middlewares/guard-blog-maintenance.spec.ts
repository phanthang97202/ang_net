import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of } from 'rxjs';
import { routes } from '../app.routes';
import { BlogMaintenanceService } from '../services/blog-maintenance.service';

@Component({ standalone: true, template: '' })
class Page {}

describe('Maintenance route redirects', () => {
  let enabled: boolean;
  beforeEach(() => {
    enabled = true;
    // Preserve production paths/guards, replacing feature components and auth guards.
    const testRoutes = routes.map(route => {
      const { loadComponent, children, canActivate, ...rest } = route;
      if (route.redirectTo !== undefined) return rest;
      return {
        ...rest,
        component: Page,
        children:
          route.path === 'dashboard'
            ? [{ path: '**', component: Page }]
            : undefined,
      };
    });
    TestBed.configureTestingModule({
      providers: [
        provideRouter(testRoutes),
        {
          provide: BlogMaintenanceService,
          useValue: { check: () => of(enabled) },
        },
      ],
    });
  });
  it('redirects home, protected modules, login and unknown URLs while allowing dashboard and maintain', async () => {
    const harness = await RouterTestingHarness.create();
    for (const path of [
      '/',
      '/news/a/b',
      '/tools/shift-report',
      '/login',
      '/unknown',
      '/dashboard-other',
    ]) {
      await harness.navigateByUrl(path);
      expect(TestBed.inject(Router).url).toBe('/maintain');
    }
    for (const path of [
      '/dashboard/users',
      '/dashboard',
      '/dashboard/login',
      '/maintain?x=1',
    ]) {
      await harness.navigateByUrl(path);
      expect(TestBed.inject(Router).url).toBe(path);
    }
  });
  it('lets retry return to home after maintenance is disabled', async () => {
    const harness = await RouterTestingHarness.create('/maintain');
    enabled = false;
    await harness.navigateByUrl('/');
    expect(TestBed.inject(Router).url).toBe('/');
    await harness.navigateByUrl('/news/a/b');
    expect(TestBed.inject(Router).url).toBe('/news/a/b');
  });
});
