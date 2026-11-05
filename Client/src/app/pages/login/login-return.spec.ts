import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd/message';
import { of } from 'rxjs';
import { AuthService, LoadingService, ShowErrorService } from '../../services';
import { BlogMaintenanceService } from '../../services/blog-maintenance.service';
import { LoginAppearanceService } from './login-appearance.service';
import { LoginComponent, safeLoginReturnUrl } from './login.component';

describe('Login return destination', () => {
  let router: jasmine.SpyObj<Router>;
  let auth: jasmine.SpyObj<AuthService>;
  let route: { snapshot: { queryParamMap: ReturnType<typeof convertToParamMap> } };
  let component: LoginComponent;

  beforeEach(() => {
    router = jasmine.createSpyObj('Router', ['navigate', 'navigateByUrl'], { url: '/login' });
    auth = jasmine.createSpyObj('AuthService', ['login', 'signInWithGoogle', 'hasAnyPermissionAtAll']);
    auth.hasAnyPermissionAtAll.and.returnValue(true);
    auth.login.and.returnValue(of({ Success: true } as any));
    auth.signInWithGoogle.and.returnValue(of({ Success: true } as any));
    route = { snapshot: { queryParamMap: convertToParamMap({ returnUrl: '/calendar?date=2026-11-05#events' }) } };
    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, LoginComponent],
      providers: [
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: route },
        { provide: AuthService, useValue: auth },
        { provide: LoadingService, useValue: { setLoading: () => {} } },
        { provide: ShowErrorService, useValue: { setShowError: () => {} } },
        { provide: NzMessageService, useValue: { create: () => {} } },
        { provide: LoginAppearanceService, useValue: {} },
        { provide: BlogMaintenanceService, useValue: { checkShiftReportOnly: () => of(false) } },
      ],
    });
    TestBed.overrideComponent(LoginComponent, { set: { template: '' } });
    component = TestBed.createComponent(LoginComponent).componentInstance;
  });

  it('returns to the requested path, query and fragment after password and Google login', () => {
    component.validateForm.setValue({ userName: 'user', password: 'pass' });
    component.submitForm(new Event('submit'));
    component.handleCredentialResponse({ credential: 'credential' });
    expect(router.navigateByUrl).toHaveBeenCalledTimes(2);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/calendar?date=2026-11-05#events');
  });

  it('keeps the existing default when no valid destination is provided', () => {
    route.snapshot.queryParamMap = convertToParamMap({ returnUrl: '//example.com' });
    component.handleCredentialResponse({ credential: 'credential' });
    expect(router.navigateByUrl).not.toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('rejects external, malformed and login-loop destinations', () => {
    for (const value of ['https://example.com', '//example.com', '/%2fexample.com', '/\\example.com', '/%5cexample.com', '/%zz', '/login?x=1', '/%6cogin', '/dashboard/login']) {
      expect(safeLoginReturnUrl(value)).withContext(value).toBeNull();
    }
    expect(safeLoginReturnUrl('/music?tab=library#songs')).toBe('/music?tab=library#songs');
  });
});
