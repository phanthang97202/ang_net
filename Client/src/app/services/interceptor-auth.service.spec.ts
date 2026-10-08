import { TestBed } from '@angular/core/testing';
import { HTTP_INTERCEPTORS, HttpClient } from '@angular/common/http';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthInterceptor } from './interceptor-auth.service';
import { ShowErrorService } from './show-error.service';
import { environment } from '../../environments/environment';

describe('Session refresh after revocation', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  let router: any;
  const access = `e30.${btoa(JSON.stringify({ nameid: 'test-user', exp: 4102444800 }))}.signature`;
  let previousAccess: string | null;
  let previousRefresh: string | null;
  beforeEach(() => {
    previousAccess = localStorage.getItem(environment.tokenKey);
    previousRefresh = localStorage.getItem(environment.refreshTokenKey);
    localStorage.setItem(environment.tokenKey, access);
    localStorage.setItem(environment.refreshTokenKey, 'test-refresh');
    router = jasmine.createSpyObj('Router', ['navigate']);
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
        { provide: Router, useValue: router },
        {
          provide: ShowErrorService,
          useValue: { setShowError: () => undefined },
        },
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
  });
  afterEach(() => {
    backend.verify();
    for (const [key, value] of [
      [environment.tokenKey, previousAccess],
      [environment.refreshTokenKey, previousRefresh],
    ]) {
      if (value === null) localStorage.removeItem(key!);
      else localStorage.setItem(key!, value!);
    }
  });
  it('fails every waiting request and clears tokens when refresh is rejected', () => {
    const errors: unknown[] = [];
    for (const path of ['first', 'second'])
      http
        .get(`${environment.apiUrl}private/${path}`)
        .subscribe({ error: e => errors.push(e) });
    backend
      .expectOne(`${environment.apiUrl}private/first`)
      .flush({}, { status: 401, statusText: 'Unauthorized' });
    backend
      .expectOne(`${environment.apiUrl}private/second`)
      .flush({}, { status: 401, statusText: 'Unauthorized' });
    const refresh = backend.expectOne(
      `${environment.apiUrl}account/refreshtoken`
    );
    expect(refresh.request.body.UserId).toBe('test-user');
    refresh.flush({ Success: false, ErrorMessage: 'Account.UserIsNotActived' });
    expect(errors.length).toBe(2);
    expect(localStorage.getItem(environment.tokenKey)).toBeNull();
    expect(localStorage.getItem(environment.refreshTokenKey)).toBeNull();
    expect(router.navigate).toHaveBeenCalledTimes(1);
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });
  it('shares a successful refresh and preserves the session if a retried API returns 500', () => {
    const errors: unknown[] = [];
    let success = false;
    http
      .get(`${environment.apiUrl}private/first`)
      .subscribe({ error: e => errors.push(e) });
    http
      .get(`${environment.apiUrl}private/second`)
      .subscribe({ next: () => (success = true) });
    for (const path of ['first', 'second'])
      backend
        .expectOne(`${environment.apiUrl}private/${path}`)
        .flush({}, { status: 401, statusText: 'Unauthorized' });
    backend
      .expectOne(`${environment.apiUrl}account/refreshtoken`)
      .flush({
        Success: true,
        Data: { AccessToken: access, RefreshToken: 'renewed-refresh' },
      });
    const first = backend.expectOne(`${environment.apiUrl}private/first`);
    expect(first.request.headers.get('Authorization')).toBe(`Bearer ${access}`);
    first.flush({}, { status: 500, statusText: 'Server Error' });
    backend.expectOne(`${environment.apiUrl}private/second`).flush({});
    expect(success).toBeTrue();
    expect(errors.length).toBe(1);
    expect(localStorage.getItem(environment.refreshTokenKey)).toBe(
      'renewed-refresh'
    );
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
