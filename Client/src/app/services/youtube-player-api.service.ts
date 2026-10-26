import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';

export interface YouTubePlayerInstance {
  destroy(): void;
  loadVideoById(videoId: string): void;
  playVideo(): void;
}

export interface YouTubePlayerEvent {
  data: number;
  target: YouTubePlayerInstance;
}

interface YouTubePlayerOptions {
  events?: {
    onError?: (event: YouTubePlayerEvent) => void;
    onReady?: (event: YouTubePlayerEvent) => void;
    onStateChange?: (event: YouTubePlayerEvent) => void;
  };
}

export interface YouTubeIframeApi {
  Player: new (
    element: HTMLIFrameElement,
    options?: YouTubePlayerOptions
  ) => YouTubePlayerInstance;
  PlayerState: {
    ENDED: number;
    PLAYING: number;
  };
}

interface YouTubeApiWindow extends Window {
  YT?: YouTubeIframeApi;
  onYouTubeIframeAPIReady?: () => void;
}

@Injectable({ providedIn: 'root' })
export class YouTubePlayerApiService {
  private readonly document = inject(DOCUMENT);
  private loadPromise?: Promise<YouTubeIframeApi>;

  load(): Promise<YouTubeIframeApi> {
    const view = this.document.defaultView as YouTubeApiWindow | null;
    if (!view) return Promise.reject(new Error('YOUTUBE_WINDOW_UNAVAILABLE'));
    if (view.YT?.Player) return Promise.resolve(view.YT);
    if (this.loadPromise) return this.loadPromise;

    this.loadPromise = new Promise<YouTubeIframeApi>((resolve, reject) => {
      const previousReady = view.onYouTubeIframeAPIReady;
      let settled = false;

      const finish = (): void => {
        if (settled || !view.YT?.Player) return;
        settled = true;
        view.clearTimeout(timeoutId);
        resolve(view.YT);
      };

      const fail = (): void => {
        if (settled) return;
        settled = true;
        view.clearTimeout(timeoutId);
        this.loadPromise = undefined;
        reject(new Error('YOUTUBE_IFRAME_API_LOAD_FAILED'));
      };

      view.onYouTubeIframeAPIReady = () => {
        try {
          previousReady?.();
        } finally {
          finish();
        }
      };

      const timeoutId = view.setTimeout(fail, 15_000);
      const existingScript = this.document.querySelector<HTMLScriptElement>(
        'script[src="https://www.youtube.com/iframe_api"]'
      );

      if (existingScript) {
        existingScript.addEventListener('load', finish, { once: true });
        existingScript.addEventListener('error', fail, { once: true });
        return;
      }

      const script = this.document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.async = true;
      script.addEventListener('load', finish, { once: true });
      script.addEventListener('error', fail, { once: true });
      this.document.head.appendChild(script);
    });

    return this.loadPromise;
  }
}
