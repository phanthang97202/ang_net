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
import { AuthService } from './auth.service';

describe('Session refresh after revocation', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  let router: any;
  const access = `e30.${btoa(JSON.stringify({ nameid: 'test-user', exp: 4102444800 }))}.signature`;
  let previousAccess: string | null;
  let previousRefresh: string | null;
  let previousAvatar: string | null;
  let previousDisplayName: string | null;
  const avatarKey = `${environment.tokenKey}.avatar`;
  const displayNameKey = `${environment.tokenKey}.displayName`;
  beforeEach(() => {
    previousAccess = localStorage.getItem(environment.tokenKey);
    previousRefresh = localStorage.getItem(environment.refreshTokenKey);
    previousAvatar = localStorage.getItem(avatarKey);
    previousDisplayName = localStorage.getItem(displayNameKey);
    localStorage.setItem(
      avatarKey,
      JSON.stringify({ userId: 'test-user', url: 'photo.jpg' })
    );
    localStorage.setItem(
      displayNameKey,
      JSON.stringify({ userId: 'test-user', name: 'Test User' })
    );
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
      [avatarKey, previousAvatar],
      [displayNameKey, previousDisplayName],
    ]) {
      if (value === null) localStorage.removeItem(key!);
      else localStorage.setItem(key!, value!);
    }
  });
  it('fails every waiting request and clears the session without navigating when refresh is rejected', () => {
    const auth = TestBed.inject(AuthService);
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
    expect(localStorage.getItem(avatarKey)).toBeNull();
    expect(localStorage.getItem(displayNameKey)).toBeNull();
    expect(auth.isLoggedIn()).toBeFalse();
    expect(auth.getAccountInfo().nameid).toBeNull();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('stays on the current page when an expired refresh token returns HTTP 401', () => {
    const expiredAccess = `e30.${btoa(JSON.stringify({ nameid: 'test-user', exp: 1 }))}.signature`;
    localStorage.setItem(environment.tokenKey, expiredAccess);
    let error: any;
    http
      .get(`${environment.apiUrl}private/first`)
      .subscribe({ error: e => (error = e) });
    const request = backend.expectOne(`${environment.apiUrl}private/first`);
    expect(request.request.headers.has('Authorization')).toBeFalse();
    request.flush({}, { status: 401, statusText: 'Unauthorized' });
    const refresh = backend.expectOne(
      `${environment.apiUrl}account/refreshtoken`
    );
    expect(refresh.request.body.UserId).toBe('test-user');
    refresh.flush(
      { ErrorMessage: 'Account.RefreshTokenInvalid' },
      { status: 401, statusText: 'Unauthorized' }
    );

    expect(error).toBeDefined();
    expect(localStorage.getItem(environment.tokenKey)).toBeNull();
    expect(localStorage.getItem(environment.refreshTokenKey)).toBeNull();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('clears an unrefreshable session without navigating when the refresh token is missing', () => {
    localStorage.removeItem(environment.refreshTokenKey);
    const errors: unknown[] = [];
    http
      .get(`${environment.apiUrl}private/first`)
      .subscribe({ error: e => errors.push(e) });
    backend
      .expectOne(`${environment.apiUrl}private/first`)
      .flush({}, { status: 401, statusText: 'Unauthorized' });

    backend.expectNone(`${environment.apiUrl}account/refreshtoken`);
    expect(errors.length).toBe(1);
    expect(localStorage.getItem(environment.tokenKey)).toBeNull();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('leaves anonymous HTTP 401 responses to the caller without refreshing or navigating', () => {
    localStorage.removeItem(environment.tokenKey);
    localStorage.removeItem(environment.refreshTokenKey);
    let status: number | undefined;
    http
      .get(`${environment.apiUrl}private/first`)
      .subscribe({ error: e => (status = e.status) });
    backend
      .expectOne(`${environment.apiUrl}private/first`)
      .flush({}, { status: 401, statusText: 'Unauthorized' });

    backend.expectNone(`${environment.apiUrl}account/refreshtoken`);
    expect(status).toBe(401);
    expect(router.navigate).not.toHaveBeenCalled();
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
    backend.expectOne(`${environment.apiUrl}account/refreshtoken`).flush({
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
