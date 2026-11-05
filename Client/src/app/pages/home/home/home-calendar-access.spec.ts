import { CommonModule } from '@angular/common';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { NZ_ICONS } from 'ng-zorro-antd/icon';
import * as icons from '@ant-design/icons-angular/icons';
import { of, Subject } from 'rxjs';
import { HomeComponent } from './home.component';
import { HomeCalendarComponent } from '../../../components/home-calendar/home-calendar.component';
import { AuthService } from '../../../services';
import { PersonalCalendarService } from '../../../services/personal-calendar.service';

describe('Home calendar access', () => {
  it('requests private calendar data only for a signed-in user with calendar permission', () => {
    let signedIn = false; let allowed = false;
    const list = jasmine.createSpy().and.returnValue(of([]));
    TestBed.configureTestingModule({ imports: [HomeComponent, TranslateModule.forRoot()], providers: [
      provideRouter([]), { provide: NZ_ICONS, useValue: Object.values(icons) },
      { provide: AuthService, useValue: { isLoggedIn: () => signedIn, hasPermission: () => allowed } },
      { provide: PersonalCalendarService, useValue: { list, changed$: new Subject<void>() } },
    ] });
    TestBed.overrideComponent(HomeComponent, { set: { imports: [CommonModule, HomeCalendarComponent], schemas: [NO_ERRORS_SCHEMA] } });
    const fixture = TestBed.createComponent(HomeComponent); fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-home-calendar')).toBeNull(); expect(list).not.toHaveBeenCalled();
    signedIn = true; fixture.detectChanges(); expect(list).not.toHaveBeenCalled();
    allowed = true; fixture.detectChanges(); expect(list).toHaveBeenCalledTimes(1);
    expect(fixture.nativeElement.querySelector('app-home-calendar')).not.toBeNull();
    allowed = false; fixture.detectChanges(); expect(fixture.nativeElement.querySelector('app-home-calendar')).toBeNull();
    fixture.destroy();
  });
});
