import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FooterComponent } from './footer.component';
import { provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { BehaviorSubject, of } from 'rxjs';
import {
  SysParameterConfigService,
  AuthService,
  VisitTrackingService,
  SYS_PARAM_CODE,
} from '../../services';

describe('FooterComponent', () => {
  let component: FooterComponent;
  let fixture: ComponentFixture<FooterComponent>;
  let loggedIn: boolean;
  let permissions: Set<string>;
  let background$: BehaviorSubject<string | null>;

  beforeEach(async () => {
    loggedIn = false;
    permissions = new Set();
    background$ = new BehaviorSubject<string | null>(null);
    await TestBed.configureTestingModule({
      imports: [FooterComponent, TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            isLoggedIn: () => loggedIn,
            hasPermission: (code: string) => permissions.has(code),
          },
        },
        {
          provide: VisitTrackingService,
          useValue: {
            stats$: of({ OnlineCount: 7, MonthlyVisits: 0, TotalVisits: 0 }),
          },
        },
        {
          provide: SysParameterConfigService,
          useValue: {
            getJson: () => of(null),
            getText: (code: string) =>
              code === SYS_PARAM_CODE.FOOTER_BACKGROUND_IMAGE
                ? background$
                : of('https://example.com/invalid-map'),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FooterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('keeps fallback branding and hides an invalid map configuration', () => {
    expect(fixture.nativeElement.textContent).toContain('PhanThang');
    expect(component.mapEmbedUrl).toBeNull();
    expect(fixture.nativeElement.querySelector('iframe')).toBeNull();
  });

  it('shows the configured image only behind the copyright and removes it when cleared', () => {
    background$.next('/assets/images/bg_footer.png');
    fixture.detectChanges();
    const footer: HTMLElement = fixture.nativeElement.querySelector('footer');
    const bottom: HTMLElement = fixture.nativeElement.querySelector('.footer-bottom');
    expect(footer.style.backgroundImage).toBe('');
    expect(bottom.classList.contains('footer-bottom--with-background')).toBeTrue();
    expect(bottom.style.backgroundImage).toContain('/assets/images/bg_footer.png');
    expect(bottom.querySelector('.footer-copyright')).not.toBeNull();
    expect(bottom.querySelector('.footer-top')).toBeNull();
    background$.next(null);
    fixture.detectChanges();
    expect(footer.classList.contains('footer--has-scenery')).toBeFalse();
    expect(bottom.classList.contains('footer-bottom--with-background')).toBeFalse();
    expect(bottom.style.backgroundImage).toBe('');
  });

  it('supports external image URLs but rejects unsafe protocols and asset traversal', () => {
    background$.next('https://example.com/footer.jpg');
    fixture.detectChanges();
    expect(component.backgroundImage).toContain('https://example.com/footer.jpg');
    for (const invalid of ['javascript:alert(1)', '/assets/../../private.png']) {
      background$.next(invalid);
      fixture.detectChanges();
      expect(component.backgroundImage).toBe('');
    }
  });

  it('hides report links until the logged-in account has the corresponding view permission', () => {
    const link = (path: string) =>
      fixture.nativeElement.querySelector(`a[href="${path}"]`);
    expect(link('/tools/shift-report')).toBeNull();
    expect(link('/tools/revenue-report')).toBeNull();
    loggedIn = true;
    permissions.add('shiftreport.view');
    fixture.detectChanges();
    expect(link('/tools/shift-report')).not.toBeNull();
    expect(link('/tools/revenue-report')).toBeNull();
    permissions.clear();
    permissions.add('revenuereport.view');
    fixture.detectChanges();
    expect(link('/tools/shift-report')).toBeNull();
    expect(link('/tools/revenue-report')).not.toBeNull();
  });
});
