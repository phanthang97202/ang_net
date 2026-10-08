import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { routes } from '../app.routes';
import { AuthService } from '../services';

describe('Report route guards', () => {
  for (const [path, permission] of [
    ['shift-report', 'shiftreport.view'],
    ['revenue-report', 'revenuereport.view'],
  ]) {
    it(`protects /tools/${path} from anonymous and unpermitted direct navigation`, () => {
      let loggedIn = false;
      let owned = 'blog.view';
      const router = jasmine.createSpyObj('Router', ['navigate']);
      TestBed.configureTestingModule({
        providers: [
          { provide: Router, useValue: router },
          {
            provide: AuthService,
            useValue: {
              isLoggedIn: () => loggedIn,
              hasPermission: (code: string) => code === owned,
            },
          },
        ],
      });
      const route = routes
        .find(route => route.path === 'tools')!
        .children!.find(route => route.path === path)!;
      expect(route.canActivate?.length).toBe(1);
      const guard = route.canActivate![0] as CanActivateFn;
      const run = () =>
        TestBed.runInInjectionContext(() =>
          guard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
        );
      expect(run()).toBeFalse();
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
      loggedIn = true;
      expect(run()).toBeFalse();
      expect(router.navigate).toHaveBeenCalledWith(['/']);
      router.navigate.calls.reset();
      owned = permission;
      expect(run()).toBeTrue();
      expect(router.navigate).not.toHaveBeenCalled();
    });
  }
});
