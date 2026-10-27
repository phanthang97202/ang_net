import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import {
  BlogMaintenanceService,
  BlogModeResult,
  TrollConfig,
} from '../../services/blog-maintenance.service';
import { HahaComponent } from './haha.component';

describe('Haha prank page', () => {
  let result: BlogModeResult;
  let router: { navigateByUrl: jasmine.Spy };
  const troll: TrollConfig = {
    message: 'Haha, mày là 1 tên hề!',
    countdown: 2,
    images: ['🤡', 'https://example.com/clown.png'],
    excludedUserIds: [],
  };
  beforeEach(() => {
    router = { navigateByUrl: jasmine.createSpy().and.resolveTo(true) };
    TestBed.configureTestingModule({
      imports: [HahaComponent, TranslateModule.forRoot()],
      providers: [
        { provide: Router, useValue: router },
        {
          provide: BlogMaintenanceService,
          useValue: { resolve: () => of(result) },
        },
      ],
    });
  });

  it('counts down, explodes, then shows the configured message', fakeAsync(() => {
    result = { target: '/haha', troll };
    const fixture = TestBed.createComponent(HahaComponent);
    fixture.detectChanges();
    const page = fixture.componentInstance;
    tick(0);
    expect(page.phase()).toBe('countdown');
    expect(page.count()).toBe(2);
    tick(1000);
    expect(page.count()).toBe(1);
    tick(1000);
    fixture.detectChanges();
    expect(page.phase()).toBe('boom');
    const images = page.particles().filter(p => p.isImage);
    expect(images.length).toBeGreaterThan(0);
    expect(page.particles().some(p => !p.isImage && p.src === '🤡')).toBeTrue();
    tick(1100);
    fixture.detectChanges();
    expect(page.phase()).toBe('done');
    expect(
      fixture.nativeElement.querySelector('.haha__message').textContent
    ).toContain('Haha, mày là 1 tên hề!');
    expect(router.navigateByUrl).not.toHaveBeenCalled();

    page.play();
    expect(page.phase()).toBe('countdown');
    fixture.destroy();
  }));

  it('leaves the page when the prank is off or the visitor is excluded', () => {
    result = { target: null, troll: null };
    TestBed.createComponent(HahaComponent).detectChanges();
    expect(router.navigateByUrl).toHaveBeenCalledOnceWith('/', {
      replaceUrl: true,
    });
  });

  it('respects maintenance over the prank', () => {
    result = { target: '/maintain', troll: null };
    TestBed.createComponent(HahaComponent).detectChanges();
    expect(router.navigateByUrl).toHaveBeenCalledOnceWith('/maintain', {
      replaceUrl: true,
    });
  });
});
