import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NZ_ICONS } from 'ng-zorro-antd/icon';
import * as icons from '@ant-design/icons-angular/icons';
import { Subject } from 'rxjs';
import { CalendarEvent, PersonalCalendarService } from '../../services/personal-calendar.service';
import { HomeCalendarComponent } from './home-calendar.component';

describe('Home personal calendar', () => {
  let fixture: ComponentFixture<HomeCalendarComponent>;
  let responses: Subject<CalendarEvent[]>[];
  let changed: Subject<void>;
  beforeEach(() => {
    responses = []; changed = new Subject<void>();
    TestBed.configureTestingModule({ imports: [HomeCalendarComponent, TranslateModule.forRoot()], providers: [
      provideRouter([]), { provide: NZ_ICONS, useValue: Object.values(icons) },
      { provide: PersonalCalendarService, useValue: { changed$: changed, list: () => { const response = new Subject<CalendarEvent[]>(); responses.push(response); return response; } } },
    ] });
    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('vi', { T_CALENDAR_UNTIL: 'Đến {{time}}' }); translate.use('vi');
    fixture = TestBed.createComponent(HomeCalendarComponent); fixture.detectChanges();
  });

  it('shows events on each day they cover and opens them in a popup', () => {
    const calendar = fixture.componentInstance;
    const first = calendar.days[10]; const next = calendar.days[11];
    responses[0].next([{ EventId: 'a', Title: 'Trực khách sạn', StartDate: first.key, EndDate: next.key, StartTime: '19:00', EndTime: '07:00', AllDay: false, Category: 'work', Location: '', Notes: '', Version: 1 }]);
    fixture.detectChanges();
    expect(calendar.days[10].events.length).toBe(1); expect(calendar.days[11].events.length).toBe(1);
    (fixture.nativeElement.querySelectorAll('.day')[11] as HTMLButtonElement).click(); fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.day-popover').textContent).toContain('Trực khách sạn');
    expect(calendar.eventTime(calendar.days[11].events[0])).toContain('07:00');
    expect(fixture.nativeElement.querySelector('.day-popover a').getAttribute('href')).toContain(next.key);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.day-popover')).toBeNull();
    fixture.destroy();
  });

  it('ignores stale month responses and refreshes after calendar changes', () => {
    const calendar = fixture.componentInstance;
    calendar.changeMonth(1); fixture.detectChanges();
    expect(responses[0].observers.length).toBe(0);
    responses[1].next([]); fixture.detectChanges();
    expect(calendar.loading).toBeFalse();
    changed.next(); expect(responses.length).toBe(3);
    responses[2].error(new Error('offline')); fixture.detectChanges();
    expect(calendar.loadError).toBeTrue();
    fixture.destroy();
  });
});
