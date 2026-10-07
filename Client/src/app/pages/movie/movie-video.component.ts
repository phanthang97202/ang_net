import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  ViewChild,
} from '@angular/core';
import type Hls from 'hls.js';

@Component({
  selector: 'app-movie-video',
  standalone: true,
  template:
    '<video #video controls playsinline (error)="nativeError()"></video>',
  styles: [
    ':host { display: block; width: 100%; height: 100%; } video { width: 100%; height: 100%; object-fit: contain; background: #050509; }',
  ],
})
export class MovieVideoComponent
  implements AfterViewInit, OnChanges, OnDestroy
{
  @Input({ required: true }) url = '';
  @Output() failed = new EventEmitter<void>();
  @ViewChild('video') video?: ElementRef<HTMLVideoElement>;
  private hls?: Hls;
  private generation = 0;
  private failureReported = true;

  nativeError(): void {
    // HLS.js owns recovery when attached; only handle native HLS errors here.
    if (!this.hls && this.video?.nativeElement.error) {
      this.reportFailure(this.generation);
    }
  }

  private reportFailure(generation: number): void {
    if (generation !== this.generation || this.failureReported) return;
    this.failureReported = true;
    this.failed.emit();
  }

  ngAfterViewInit(): void {
    void this.load();
  }
  ngOnChanges(): void {
    if (this.video) void this.load();
  }
  ngOnDestroy(): void {
    this.clear();
  }

  private clear(): void {
    this.generation++;
    this.failureReported = true;
    this.hls?.destroy();
    this.hls = undefined;
    const video = this.video?.nativeElement;
    if (video) {
      video.pause();
      video.removeAttribute('src');
      video.load();
    }
  }

  private async load(): Promise<void> {
    this.clear();
    const generation = this.generation;
    const video = this.video?.nativeElement;
    if (!video || !this.url) return;
    this.failureReported = false;
    const play = () => {
      void video.play().catch(() => {
        /* Browser may require Play; never force mute. */
      });
    };
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = this.url;
      play();
      return;
    }
    try {
      const { default: Hls } = await import('hls.js');
      if (generation !== this.generation) return;
      if (!Hls.isSupported()) {
        this.reportFailure(generation);
        return;
      }
      const hls = (this.hls = new Hls({ enableWorker: true }));
      let recovered = false;
      hls.on(Hls.Events.MANIFEST_PARSED, play);
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (!data.fatal || generation !== this.generation) return;
        if (data.type === Hls.ErrorTypes.MEDIA_ERROR && !recovered) {
          recovered = true;
          hls.recoverMediaError();
        } else {
          hls.destroy();
          this.hls = undefined;
          this.reportFailure(generation);
        }
      });
      hls.loadSource(this.url);
      hls.attachMedia(video);
    } catch {
      this.reportFailure(generation);
    }
  }
}
