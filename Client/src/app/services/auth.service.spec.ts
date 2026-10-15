import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

describe('AuthService profile', () => {
  let auth: AuthService;
  let http: HttpTestingController;
  let router: jasmine.SpyObj<Router>;
  const cacheKey = `${environment.tokenKey}.avatar`;
  const nameKey = `${environment.tokenKey}.displayName`;
  const token = (id: string) =>
    `e30.${btoa(JSON.stringify({ nameid: id, name: 'Test User', avatar: 'https://example.com/old.jpg' }))}.signature`;

  beforeEach(() => {
    router = jasmine.createSpyObj('Router', ['navigate']);
    localStorage.removeItem(cacheKey);
    localStorage.removeItem(nameKey);
    localStorage.setItem(environment.tokenKey, token('me'));
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService, { provide: Router, useValue: router }],
    });
    auth = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  it('clears expired-session credentials and profile without redirecting', () => {
    localStorage.setItem(environment.refreshTokenKey, 'expired-refresh');
    localStorage.setItem(
      cacheKey,
      JSON.stringify({ userId: 'me', url: 'photo.jpg' })
    );
    localStorage.setItem(
      nameKey,
      JSON.stringify({ userId: 'me', name: 'Saved Name' })
    );
    auth.clearSession();

    expect(auth.isLoggedIn()).toBeFalse();
    expect(auth.getAccountInfo().nameid).toBeNull();
    expect(localStorage.getItem(environment.refreshTokenKey)).toBeNull();
    expect(localStorage.getItem(cacheKey)).toBeNull();
    expect(localStorage.getItem(nameKey)).toBeNull();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('still redirects when the user explicitly logs out', () => {
    auth.logout();

    expect(auth.getToken()).toBe('');
    expect(router.navigate).toHaveBeenCalledOnceWith(['/login']);
  });

  it('clears an expired refresh token silently on page reload', () => {
    localStorage.setItem(environment.refreshTokenKey, 'expired-refresh');
    auth.tryRefreshOnInit();
    http.expectOne(`${environment.apiUrl}account/refreshtoken`).flush({
      Success: false,
      ErrorMessage: 'Account.RefreshTokenInvalid',
    });

    expect(auth.isLoggedIn()).toBeFalse();
    expect(auth.getToken()).toBe('');
    expect(localStorage.getItem(environment.refreshTokenKey)).toBeNull();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  afterEach(() => {
    http.verify();
    localStorage.removeItem(environment.tokenKey);
    localStorage.removeItem(cacheKey);
    localStorage.removeItem(nameKey);
  });

  it('saves only a trimmed URL and immediately replaces the stale JWT avatar, including after reload', () => {
    const url = 'https://example.com/new.jpg';
    auth.updateAvatar(` ${url} `).subscribe();
    const request = http.expectOne(`${environment.apiUrl}account/avatar`);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({ AvatarUrl: url });
    request.flush({ Success: true, Data: { Id: 'me', Avatar: url } });
    expect(auth.getAccountInfo().avatar).toBe(url);
    const reloaded = new AuthService(
      TestBed.inject(HttpClient),
      TestBed.inject(Router)
    );
    expect(reloaded.getAccountInfo().avatar).toBe(url);
  });

  it('never applies a previous account photo to another account', () => {
    auth.updateAvatar('https://example.com/new.jpg').subscribe();
    http.expectOne(`${environment.apiUrl}account/avatar`).flush({
      Success: true,
      Data: { Id: 'me', Avatar: 'https://example.com/new.jpg' },
    });
    localStorage.setItem(environment.tokenKey, token('other'));
    expect(auth.getAccountInfo().avatar).toBe('https://example.com/old.jpg');
  });

  it('keeps the saved photo when a request fails', () => {
    auth
      .updateAvatar('https://example.com/new.jpg')
      .subscribe({ error: () => {} });
    http
      .expectOne(`${environment.apiUrl}account/avatar`)
      .flush({}, { status: 500, statusText: 'Error' });
    expect(auth.getAccountInfo().avatar).toBe('https://example.com/old.jpg');
    expect(localStorage.getItem(cacheKey)).toBeNull();
  });

  it('saves a trimmed display name and updates the current profile immediately and after reload', () => {
    auth.updateDisplayName('  Thắng Phan  ').subscribe();
    const request = http.expectOne(`${environment.apiUrl}account/display-name`);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({ FullName: 'Thắng Phan' });
    request.flush({
      Success: true,
      Data: {
        Id: 'me',
        FullName: 'Thắng Phan',
        Avatar: 'https://example.com/old.jpg',
      },
    });
    expect(auth.getAccountInfo().name).toBe('Thắng Phan');
    expect(auth.getAccountInfo().shortname).toBe('T');
    expect(auth.getToken()).toBe(token('me'));
    const reloaded = new AuthService(
      TestBed.inject(HttpClient),
      TestBed.inject(Router)
    );
    expect(reloaded.getAccountInfo().name).toBe('Thắng Phan');

    localStorage.setItem(environment.tokenKey, token('other'));
    expect(auth.getAccountInfo().name).toBe('Test User');
    auth.logout();
    expect(localStorage.getItem(nameKey)).toBeNull();
  });

  it('keeps the current display name when saving fails', () => {
    auth.updateDisplayName('New Name').subscribe({ error: () => {} });
    http
      .expectOne(`${environment.apiUrl}account/display-name`)
      .flush({}, { status: 500, statusText: 'Error' });
    expect(auth.getAccountInfo().name).toBe('Test User');
    expect(localStorage.getItem(nameKey)).toBeNull();
  });
});
