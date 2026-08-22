import {
  Component,
  ElementRef,
  Input,
  OnChanges,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { IReelDto } from '../../../../interfaces';

@Component({
  selector: 'app-reel-item',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reel-item.component.html',
  styleUrl: './reel-item.component.scss',
})
export class ReelItemComponent implements OnChanges {
  @Input({ required: true }) reel!: IReelDto;
  @Input() isActive = false;
  @Input() isMuted = true;
  @Input() isMounted = false;

  @ViewChild('videoRef') videoRef?: ElementRef<HTMLVideoElement>;

  get isVideo(): boolean {
    return this.reel.MediaType === 'Video';
  }

  get mediaUrl(): string {
    return this.reel.Media?.[0]?.MediaUrl ?? '';
  }

  ngOnChanges(changes: SimpleChanges): void {
    const video = this.videoRef?.nativeElement;
    if (!this.isVideo || !video) {
      return;
    }

    if (changes['isActive']) {
      if (this.isActive) {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    }

    if (changes['isMuted']) {
      video.muted = this.isMuted;
    }
  }

  onCanPlay(): void {
    if (this.isActive) {
      this.videoRef?.nativeElement.play().catch(() => {});
    }
  }
}
