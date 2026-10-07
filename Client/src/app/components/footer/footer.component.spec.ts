import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FooterComponent } from './footer.component';
import { provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import {
  SysParameterConfigService,
  VisitTrackingService,
} from '../../services';

describe('FooterComponent', () => {
  let component: FooterComponent;
  let fixture: ComponentFixture<FooterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FooterComponent, TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
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
});
