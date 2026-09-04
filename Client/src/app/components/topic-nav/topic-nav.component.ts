import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  LoadingService,
  NewsCacheService,
  ShowErrorService,
} from '../../services';
import { ScrollRevealDirective } from '../../directives';

// ── Model ──────────────────────────────────────────────
export interface Topic {
  id: string;
  name: string;
}

// ── Icon set (Material single-path icons) ───────────────
const ICON_TRAVEL =
  'M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2.5 1.5V22l4-1 4 1v-1.5L13 19v-5.5l8 2.5z';
const ICON_FOOD =
  'M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z';
const ICON_CODE =
  'M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z';
const ICON_TROPHY =
  'M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.95V19H7v2h10v-2h-4v-3.11c1.63-.32 2.98-1.45 3.61-2.95C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z';
const ICON_FILM =
  'M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-2z';
const ICON_MUSIC =
  'M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z';
const ICON_BOOK =
  'M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 18H6V4h5v8l2.5-1.5L16 12V4h2v16z';
const ICON_HEART =
  'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z';
const ICON_STAR =
  'M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z';
const ICON_COMPASS =
  'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm2.19 12.19L6 16l3.81-8.19L18 6l-3.81 8.19z';
const ICON_TAG =
  'M17.63 5.84C17.27 5.33 16.67 5 16 5L5 5.01C3.9 5.01 3 5.9 3 7v10c0 1.1.9 1.99 2 1.99L16 19c.67 0 1.27-.33 1.63-.84L22 12l-4.37-6.16z';
const ICON_FLAME =
  'M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z';

// Khớp icon theo từ khoá trong tên chủ đề, không khớp thì cycle icon mặc định
const KEYWORD_ICONS: { keywords: string[]; icon: string }[] = [
  { keywords: ['du lịch', 'travel'], icon: ICON_TRAVEL },
  { keywords: ['ẩm thực', 'món ăn', 'food'], icon: ICON_FOOD },
  { keywords: ['code', 'công nghệ', 'lập trình', 'tech'], icon: ICON_CODE },
  { keywords: ['thể thao', 'sport'], icon: ICON_TROPHY },
  { keywords: ['phim', 'movie'], icon: ICON_FILM },
  { keywords: ['nhạc', 'music'], icon: ICON_MUSIC },
  { keywords: ['sách', 'book'], icon: ICON_BOOK },
  { keywords: ['đời sống', 'life'], icon: ICON_HEART },
];

const FALLBACK_ICONS = [ICON_STAR, ICON_COMPASS, ICON_TAG, ICON_FLAME];

const CARD_COLORS = [
  '#5b4fe9',
  '#e95f9c',
  '#3fb2a6',
  '#f2994a',
  '#7a6b8a',
  '#4a90d9',
];

@Component({
  selector: 'app-topic-nav',
  standalone: true,
  imports: [CommonModule, RouterLink, ScrollRevealDirective],
  templateUrl: './topic-nav.component.html',
  styleUrls: ['./topic-nav.component.scss'],
})
export class TopicNavComponent implements OnInit {
  showErrorService = inject(ShowErrorService);
  newsCacheService = inject(NewsCacheService);
  loadingService = inject(LoadingService);
  topics: Topic[] = [];
  isLoading = false;

  ngOnInit(): void {
    this.loadTopics();
  }

  loadTopics(): void {
    this.isLoading = true;
    this.newsCacheService.GetAllActiveNewsCategory().subscribe({
      next: res => {
        this.topics = (res.DataList || []).map(category => ({
          id: category.NewsCategoryId,
          name: category.NewsCategoryName,
        }));
        this.isLoading = false;
      },
      error: err => {
        this.showErrorService.setShowError({
          icon: 'warning',
          message: JSON.stringify(err, null, 2),
          title: err.message,
        });
        this.isLoading = false;
        throw new Error(err);
      },
    });
  }

  trackById(_: number, topic: Topic): string {
    return topic.id;
  }

  getTopicIconPath(name: string, index: number): string {
    const lower = name.toLowerCase();
    const matched = KEYWORD_ICONS.find(entry =>
      entry.keywords.some(kw => lower.includes(kw))
    );
    return matched ? matched.icon : FALLBACK_ICONS[index % FALLBACK_ICONS.length];
  }

  getTopicColor(index: number): string {
    return CARD_COLORS[index % CARD_COLORS.length];
  }
}
