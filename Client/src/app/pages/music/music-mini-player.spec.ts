import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { NZ_ICONS } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import * as icons from '@ant-design/icons-angular/icons';
import { of } from 'rxjs';
import { MusicComponent } from './music.component';
import { YouTubeMusicComponent } from './youtube-music.component';
import { AudiusMusicService, MusicLibraryService } from '../../services';
import { YouTubeMusicService } from '../../services/youtube-music.service';
import { YouTubePlayerApiService } from '../../services/youtube-player-api.service';
import { MusicAnalyticsService } from '../../services/music-analytics.service';

describe('Persistent music player', () => {
  it('keeps the same video element when entering and leaving mini mode', () => {
    TestBed.configureTestingModule({
      imports: [MusicComponent, TranslateModule.forRoot(), HttpClientTestingModule, NoopAnimationsModule],
      providers: [provideRouter([]), { provide: NZ_ICONS, useValue: Object.values(icons) },
        { provide: NzMessageService, useValue: {} },
        { provide: MusicAnalyticsService, useValue: { record: () => {} } },
        { provide: AudiusMusicService, useValue: {} },
        { provide: YouTubeMusicService, useValue: { discover: () => of([]) } },
        { provide: YouTubePlayerApiService, useValue: {} },
        { provide: MusicLibraryService, useValue: { toast: signal(null), pickerTrack: signal(null), refreshSaveState: () => {} } },
      ],
    });
    TestBed.overrideComponent(YouTubeMusicComponent, { set: { template: '<div class="youtube-player__frame"><iframe title="test"></iframe></div>' } });
    const fixture = TestBed.createComponent(MusicComponent);
    fixture.detectChanges();
    const youtube = fixture.debugElement.query(By.directive(YouTubeMusicComponent)).componentInstance as YouTubeMusicComponent;
    youtube.currentTrack = { id: '1', title: 'Song', artist: '', thumbnailUrl: '', watchUrl: '' };
    fixture.detectChanges();
    const frame = fixture.nativeElement.querySelector('iframe');
    fixture.componentRef.setInput('mini', true); fixture.detectChanges();
    expect(fixture.nativeElement.classList).toContain('music-mini');
    expect(fixture.nativeElement.querySelector('iframe')).toBe(frame);
    expect(fixture.nativeElement.querySelector('.mini-header')).not.toBeNull();
    fixture.componentRef.setInput('mini', false); fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('iframe')).toBe(frame);
    fixture.destroy();
  });
});
