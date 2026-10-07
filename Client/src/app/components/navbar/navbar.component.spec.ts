import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import {
  ApiService,
  AuthService,
  LangService,
  NoteRealtimeService,
} from '../../services';
import { NavbarComponent } from './navbar.component';
import { NZ_ICONS } from 'ng-zorro-antd/icon';
import {
  HomeOutline,
  ToolOutline,
  CalculatorOutline,
  FileTextOutline,
  DollarOutline,
  PlayCircleOutline,
  TrophyOutline,
  AppstoreOutline,
  SearchOutline,
  CloseOutline,
  ArrowRightOutline,
} from '@ant-design/icons-angular/icons';

describe('NavbarComponent search keyboard flow', () => {
  it('focuses the search field, closes with Escape and restores focus to the trigger', fakeAsync(() => {
    TestBed.configureTestingModule({
      imports: [NavbarComponent, TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        {
          provide: NZ_ICONS,
          useValue: [
            HomeOutline,
            ToolOutline,
            CalculatorOutline,
            FileTextOutline,
            DollarOutline,
            PlayCircleOutline,
            TrophyOutline,
            AppstoreOutline,
            SearchOutline,
            CloseOutline,
            ArrowRightOutline,
          ],
        },
        { provide: ApiService, useValue: {} },
        { provide: AuthService, useValue: { isLoggedIn: () => false } },
        { provide: LangService, useValue: {} },
        { provide: NoteRealtimeService, useValue: { unreadCount$: of(0) } },
      ],
    });
    spyOn(NavbarComponent.prototype, 'ngOnInit').and.stub();
    const fixture = TestBed.createComponent(NavbarComponent);
    fixture.detectChanges();
    const trigger = [
      ...fixture.nativeElement.querySelectorAll(
        '[aria-controls="navbar-search"]'
      ),
    ].find(
      (button: HTMLButtonElement) => button.getBoundingClientRect().width > 0
    ) as HTMLButtonElement;
    trigger.click();
    fixture.detectChanges();
    const field = fixture.nativeElement.querySelector(
      '.search-popup-input'
    ) as HTMLInputElement;
    tick();
    expect(document.activeElement).toBe(field);
    field.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
    );
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#navbar-search')).toBeNull();
    expect(document.activeElement).toBe(trigger);
    expect(
      fixture.nativeElement.querySelector('#navbar-mobile-menu')
    ).toBeNull();
    fixture.destroy();
  }));
});
