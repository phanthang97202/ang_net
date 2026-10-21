import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { BehaviorSubject } from 'rxjs';
import { LangService } from '../../services/lang-service.service';
import { SysParameterConfigService } from '../../services/sys-parameter-config.service';
import {
  DEFAULT_LOGIN_IMAGE,
  LoginAppearance,
  LoginAppearanceService,
} from './login-appearance.service';

describe('Login appearance system parameter', () => {
  let service: LoginAppearanceService;
  let http: HttpTestingController;
  let config: SysParameterConfigService;
  let lang: 'vi' | 'en';
  let languageChanges: BehaviorSubject<string>;
  const defaults: LoginAppearance = {
    image: DEFAULT_LOGIN_IMAGE,
    description: null,
  };

  beforeEach(() => {
    lang = 'vi';
    languageChanges = new BehaviorSubject<string>(lang);
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        {
          provide: LangService,
          useValue: {
            getLang: () => lang,
            $langSubjectObservable: languageChanges.asObservable(),
          },
        },
      ],
    });
    service = TestBed.inject(LoginAppearanceService);
    config = TestBed.inject(SysParameterConfigService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  const request = () =>
    http.expectOne(req =>
      req.url.endsWith('SysParameter/Detail?key=LOGIN_APPEARANCE')
    );

  it('loads both fields from one public parameter and follows language changes without another request', () => {
    const values: LoginAppearance[] = [];
    const subscription = service.load().subscribe(value => values.push(value));
    const req = request();
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({
      Success: true,
      Data: {
        FlagActive: true,
        ParameterValueVi: JSON.stringify({
          image: '/assets/images/bg_about_me.png',
          description: 'Mô tả mới',
        }),
        ParameterValueEn: JSON.stringify({
          image: 'https://example.com/login.jpg',
          description: 'Welcome to my blog',
        }),
      },
    });
    expect(values.at(-1)).toEqual({
      image: '/assets/images/bg_about_me.png',
      description: 'Mô tả mới',
    });
    lang = 'en';
    languageChanges.next(lang);
    expect(values.at(-1)).toEqual({
      image: 'https://example.com/login.jpg',
      description: 'Welcome to my blog',
    });
    http.expectNone(req => req.url.includes('LOGIN_APPEARANCE'));
    subscription.unsubscribe();
  });

  it('keeps the default appearance when the parameter is missing, inactive or malformed', () => {
    for (const response of [
      { Success: false, Data: null },
      {
        Success: true,
        Data: {
          FlagActive: false,
          ParameterValueVi:
            '{"image":"/inactive.jpg","description":"Inactive"}',
        },
      },
      ...['{invalid', '[]', 'null', '42', '"text"'].map(raw => ({
        Success: true,
        Data: { FlagActive: true, ParameterValueVi: raw },
      })),
    ]) {
      config.invalidate('LOGIN_APPEARANCE');
      const subscription = service
        .load()
        .subscribe(value => expect(value).toEqual(defaults));
      request().flush(response);
      subscription.unsubscribe();
    }
  });

  it('falls back per field and keeps configured text when the image value is invalid', () => {
    for (const image of [
      'javascript:alert(1)',
      'data:image/svg+xml,<svg/>',
      '//example.com/img.jpg',
      'invalid-url',
      123,
    ]) {
      config.invalidate('LOGIN_APPEARANCE');
      const subscription = service
        .load()
        .subscribe(value =>
          expect(value).toEqual({
            image: DEFAULT_LOGIN_IMAGE,
            description: 'Configured text',
          })
        );
      request().flush({
        Success: true,
        Data: {
          FlagActive: true,
          ParameterValueVi: JSON.stringify({
            image,
            description: '  Configured text  ',
          }),
        },
      });
      subscription.unsubscribe();
    }
  });

  it('allows an empty description to hide the text', () => {
    service
      .load()
      .subscribe(value =>
        expect(value).toEqual({ image: DEFAULT_LOGIN_IMAGE, description: '' })
      );
    request().flush({
      Success: true,
      Data: { FlagActive: true, ParameterValueVi: '{"description":""}' },
    });
  });

  it('keeps login available when the configuration endpoint fails', () => {
    service.load().subscribe(value => expect(value).toEqual(defaults));
    request().flush('Unavailable', { status: 503, statusText: 'Unavailable' });
  });
});
