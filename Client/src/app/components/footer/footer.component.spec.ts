import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FooterComponent } from './footer.component';
import { provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import {
  SysParameterConfigService,
  AuthService,
  VisitTrackingService,
} from '../../services';

describe('FooterComponent', () => {
  let component: FooterComponent;
  let fixture: ComponentFixture<FooterComponent>;
  let loggedIn: boolean;
  let permissions: Set<string>;

  beforeEach(async () => {
    loggedIn = false;
    permissions = new Set();
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
            getText: () => of('https://example.com/invalid-map'),
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
