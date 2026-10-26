import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { environment } from '../../../environments/environment';
import {
  TurnstileApi,
  TurnstileService,
} from '../../services/turnstile.service';
import { TurnstileComponent } from './turnstile.component';

describe('Turnstile widget lifecycle', () => {
  let originalKey: string;
  let api: jasmine.SpyObj<TurnstileApi>;
  let loader: jasmine.SpyObj<TurnstileService>;

  beforeEach(() => {
    originalKey = environment.turnstileSiteKey;
    environment.turnstileSiteKey = 'public-site-key';
    api = jasmine.createSpyObj('Turnstile', ['render', 'reset', 'remove']);
    api.render.and.returnValue('widget');
    loader = jasmine.createSpyObj('Loader', ['load']);
    loader.load.and.callFake(() => Promise.resolve(api));
    TestBed.configureTestingModule({
      imports: [TurnstileComponent, TranslateModule.forRoot()],
      providers: [{ provide: TurnstileService, useValue: loader }],
    });
  });
  afterEach(() => {
    environment.turnstileSiteKey = originalKey;
    document.querySelector('meta[name="turnstile-site-key"]')?.remove();
  });

  it('uses the key injected by the hosting build when Angular configuration is empty', fakeAsync(() => {
    environment.turnstileSiteKey = '';
    const meta = document.createElement('meta');
    meta.name = 'turnstile-site-key';
    meta.content = 'vercel-public-site-key';
    document.head.appendChild(meta);
    const fixture = TestBed.createComponent(TurnstileComponent);
    fixture.detectChanges();
    flushMicrotasks();
    expect(api.render.calls.mostRecent().args[1].sitekey).toBe(
      'vercel-public-site-key'
    );
    fixture.destroy();
  }));

  it('emits tokens, invalidates expired/error tokens, resets and removes the widget', fakeAsync(() => {
    const fixture = TestBed.createComponent(TurnstileComponent);
    const tokens: string[] = [];
    fixture.componentInstance.tokenChange.subscribe(token =>
      tokens.push(token)
    );
    fixture.detectChanges();
    flushMicrotasks();
    const options = api.render.calls.mostRecent().args[1];
    expect(options.action).toBe('news_comment');
    options.callback('token');
    expect(tokens.at(-1)).toBe('token');
    options['expired-callback']();
    expect(tokens.at(-1)).toBe('');
    options['error-callback']();
    expect(fixture.componentInstance.status).toBe(
      'T_COMMENT_CAPTCHA_LOAD_ERROR'
    );
    fixture.componentInstance.retry();
    expect(api.reset).toHaveBeenCalledWith('widget');
    fixture.destroy();
    expect(api.remove).toHaveBeenCalledWith('widget');
    const count = tokens.length;
    options.callback('late-token');
    expect(tokens.length).toBe(count);
  }));

  it('allows retry after script load failure', fakeAsync(() => {
    loader.load.and.callFake(() => Promise.reject(new Error('offline')));
    const fixture = TestBed.createComponent(TurnstileComponent);
    fixture.detectChanges();
    flushMicrotasks();
    expect(fixture.componentInstance.status).toBe(
      'T_COMMENT_CAPTCHA_LOAD_ERROR'
    );
    loader.load.and.callFake(() => Promise.resolve(api));
    fixture.componentInstance.retry();
    flushMicrotasks();
    expect(api.render).toHaveBeenCalledTimes(1);
    fixture.destroy();
  }));

  it('does not render a widget if the user navigates away while the script is loading', fakeAsync(() => {
    let resolve!: (api: TurnstileApi) => void;
    loader.load.and.returnValue(
      new Promise(value => {
        resolve = value;
      })
    );
    const fixture = TestBed.createComponent(TurnstileComponent);
    fixture.detectChanges();
    flushMicrotasks();
    fixture.destroy();
    resolve(api);
    flushMicrotasks();
    expect(api.render).not.toHaveBeenCalled();
  }));
});
