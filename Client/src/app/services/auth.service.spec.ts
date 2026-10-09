import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

describe('AuthService avatar', () => {
  let auth: AuthService;
  let http: HttpTestingController;
  const cacheKey = `${environment.tokenKey}.avatar`;
  const token = (id: string) =>
    `e30.${btoa(JSON.stringify({ nameid: id, name: 'Test User', avatar: 'https://example.com/old.jpg' }))}.signature`;

  beforeEach(() => {
    localStorage.removeItem(cacheKey);
    localStorage.setItem(environment.tokenKey, token('me'));
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        { provide: Router, useValue: { navigate: () => {} } },
      ],
    });
    auth = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    localStorage.removeItem(environment.tokenKey);
    localStorage.removeItem(cacheKey);
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
    http
      .expectOne(`${environment.apiUrl}account/avatar`)
      .flush({
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
});
