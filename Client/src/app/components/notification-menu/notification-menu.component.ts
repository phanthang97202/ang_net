import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  ViewChild,
  DoCheck,
  HostListener,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';
import { Router } from '@angular/router';
import { NzPopoverModule } from 'ng-zorro-antd/popover';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BlogNotificationService } from '../../services/blog-notification.service';
import { BlogNotification } from '../../interfaces/blog-notification';
import { InfiniteScrollDirective } from '../../directives/infinite-scroll.directive';
import { TimeAgo } from '../../pipes/timeAgo.pipe';

let nextMenuId = 0;

@Component({
  selector: 'app-notification-menu',
  standalone: true,
  imports: [
    CommonModule,
    NzPopoverModule,
    TranslateModule,
    InfiniteScrollDirective,
    TimeAgo,
  ],
  templateUrl: './notification-menu.component.html',
  styleUrl: './notification-menu.component.scss',
})
export class NotificationMenuComponent implements OnInit, OnDestroy, DoCheck {
  @ViewChild('bell') private bell?: ElementRef<HTMLButtonElement>;
  readonly state = inject(BlogNotificationService);
  readonly translate = inject(TranslateService);
  private router = inject(Router);
  readonly id = `notifications-${++nextMenuId}`;
  ngOnInit(): void {
    this.state.attach();
  }
  ngDoCheck(): void {
    this.state.syncAccount();
  }
  ngOnDestroy(): void {
    this.state.show(this.id, false);
    this.state.detach();
  }
  @HostListener('document:keydown.escape')
  @HostListener('window:resize')
  close(): void {
    const wasOpen = this.state.activeMenu() === this.id;
    this.state.show(this.id, false);
    if (wasOpen) this.bell?.nativeElement.focus({ preventScroll: true });
  }
  openChange(open: boolean): void {
    this.state.show(this.id, open);
  }
  link(item: BlogNotification): string {
    return this.router.serializeUrl(
      this.router.createUrlTree(['/news', item.CategoryNewsId, item.NewsId], {
        queryParams: { commentId: item.CommentId },
        fragment: `news-comment-${item.CommentId}`,
      })
    );
  }
  visit(event: MouseEvent, item: BlogNotification): void {
    if (!item.ReadAt) this.state.read(item);
    // Keep native open-in-new-tab behaviour for modified clicks.
    if (
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      event.altKey ||
      event.button !== 0
    )
      return;
    event.preventDefault();
    this.close();
    void this.router.navigate(['/news', item.CategoryNewsId, item.NewsId], {
      queryParams: { commentId: item.CommentId },
      fragment: `news-comment-${item.CommentId}`,
    });
  }
}
