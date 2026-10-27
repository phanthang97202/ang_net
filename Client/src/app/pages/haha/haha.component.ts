import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import {
  BlogMaintenanceService,
  TROLL_PATH,
  TrollConfig,
} from '../../services/blog-maintenance.service';

type Phase = 'loading' | 'countdown' | 'boom' | 'done';

interface Particle {
  id: number;
  src: string;
  isImage: boolean;
  failed: boolean;
  x: string;
  y: string;
  rot: string;
  tilt: string;
  size: string;
  delay: string;
  floatDuration: string;
  floatDelay: string;
}

const BOOM_DURATION_MS = 1100;

// Link ảnh (http/https hoặc đường dẫn trong site); còn lại coi là emoji / chữ ngắn
const isImageSource = (value: string): boolean =>
  /^https?:\/\//i.test(value) || value.startsWith('/');

/**
 * Trang chơi khăm của TROLL_VIETNAM: đếm ngược -> BOOM -> hình nổ tung bay khắp
 * màn hình -> câu chọc ghẹo ở giữa. Mọi nội dung lấy từ tham số hệ thống.
 */
@Component({
  selector: 'app-haha',
  standalone: true,
  imports: [TranslateModule],
  templateUrl: './haha.component.html',
  styleUrl: './haha.component.scss',
})
export class HahaComponent implements OnInit {
  private readonly blogMode = inject(BlogMaintenanceService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private timers: ReturnType<typeof setTimeout>[] = [];
  private config: TrollConfig | null = null;

  readonly phase = signal<Phase>('loading');
  readonly count = signal(0);
  readonly message = signal('');
  readonly particles = signal<Particle[]>([]);

  constructor() {
    this.destroyRef.onDestroy(() => this.clearTimers());
  }

  ngOnInit(): void {
    // Cùng thứ tự ưu tiên với guard: bảo trì thắng troll; tắt troll hoặc người
    // được loại trừ mà vào thẳng /haha thì đưa về đúng chỗ của họ.
    this.blogMode
      .resolve('/')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ target, troll }) => {
        if (target !== TROLL_PATH || !troll) {
          void this.router.navigateByUrl(target ?? '/', { replaceUrl: true });
          return;
        }
        this.config = troll;
        this.message.set(troll.message);
        this.play();
      });
  }

  play(): void {
    const config = this.config;
    if (!config) return;
    this.clearTimers();
    this.particles.set([]);
    this.phase.set('countdown');

    for (let step = 0; step < config.countdown; step++) {
      this.later(step * 1000, () => this.count.set(config.countdown - step));
    }
    this.later(config.countdown * 1000, () => {
      this.particles.set(this.createParticles(config.images));
      this.phase.set('boom');
    });
    this.later(config.countdown * 1000 + BOOM_DURATION_MS, () =>
      this.phase.set('done')
    );
  }

  imageFailed(particle: Particle): void {
    particle.failed = true;
  }

  private createParticles(images: string[]): Particle[] {
    const total = window.innerWidth < 600 ? 12 : 20;
    const random = (min: number, max: number) =>
      min + Math.random() * (max - min);

    return Array.from({ length: total }, (_, id) => {
      const src = images[id % images.length];
      // Rải đều theo góc, chừa vùng giữa cho câu thông điệp
      const angle = (id / total) * Math.PI * 2 + random(-0.25, 0.25);
      const radius = random(24, 46);
      return {
        id,
        src,
        isImage: isImageSource(src),
        failed: false,
        x: `${(Math.cos(angle) * radius).toFixed(1)}vw`,
        y: `${(Math.sin(angle) * radius * 0.9).toFixed(1)}vh`,
        rot: `${Math.round(random(-540, 540))}deg`,
        tilt: `${Math.round(random(-22, 22))}deg`,
        size: `${Math.round(random(56, window.innerWidth < 600 ? 84 : 118))}px`,
        delay: `${Math.round(random(0, 160))}ms`,
        floatDuration: `${random(2.6, 4.8).toFixed(2)}s`,
        floatDelay: `${random(0, 1.5).toFixed(2)}s`,
      };
    });
  }

  private later(delay: number, run: () => void): void {
    this.timers.push(setTimeout(run, delay));
  }

  private clearTimers(): void {
    this.timers.forEach(clearTimeout);
    this.timers = [];
  }
}
