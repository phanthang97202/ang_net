import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd/message';
import { AuthService, ShowErrorService } from '../../services';
import { IUser } from '../../interfaces';
import {
  AntdModule,
  REUSE_COMPONENT_MODULES,
  REUSE_PIPE_MODULE,
} from '../../modules';

/**
 * Một mục trong sidebar. Thêm tab mới = thêm 1 phần tử vào profileNav rồi
 * thêm một nhánh @case tương ứng trong template - không phải đụng gì khác.
 */
export interface ProfileNavItem {
  /** Trùng với giá trị queryParam ?tab= */
  id: string;
  labelKey: string;
  icon: string;
  /** false = chưa có nội dung, bấm vào chỉ báo đang phát triển */
  available: boolean;
}

export interface ProfileNavSection {
  titleKey: string;
  items: ProfileNavItem[];
}

@Component({
  selector: 'app-detail-user',
  standalone: true,
  imports: [AntdModule, ...REUSE_COMPONENT_MODULES, ...REUSE_PIPE_MODULE],
  templateUrl: './detail-user.component.html',
  styleUrl: './detail-user.component.scss',
})
export class DetailUserComponent implements OnInit {
  authService = inject(AuthService);
  showErrorService = inject(ShowErrorService);
  private message = inject(NzMessageService);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);

  userInfo: IUser | null = null;
  activeTab = 'profile';

  profileNav: ProfileNavSection[] = [
    {
      titleKey: 'T_ACCOUNT',
      items: [
        { id: 'profile', labelKey: 'T_MYPROFILE', icon: 'user', available: true },
        { id: 'security', labelKey: 'T_SECURITY', icon: 'safety', available: false },
      ],
    },
    {
      titleKey: 'T_CONTENT',
      items: [
        { id: 'reels', labelKey: 'T_MYREELS', icon: 'play-circle', available: false },
        { id: 'posts', labelKey: 'T_MYPOSTS', icon: 'read', available: false },
      ],
    },
  ];

  ngOnInit() {
    // Tab nằm trong URL để chia sẻ link và nút back của trình duyệt đều hoạt động
    this.activatedRoute.queryParams.subscribe(params => {
      const tab = params['tab'];
      this.activeTab = this.isAvailableTab(tab) ? tab : 'profile';
    });

    this.authService.getUserDetail().subscribe({
      next: res => {
        this.userInfo = res.Data;
      },
      error: err => {
        this.showErrorService.setShowError({
          icon: 'warning',
          message: JSON.stringify(err, null, 2),
          title: err.message,
        });
        throw new Error(err);
      },
    });
  }

  get avatarUrl(): string | null {
    return this.userInfo?.Avatar || null;
  }

  get displayInitial(): string {
    return (this.userInfo?.FullName || '?').charAt(0).toUpperCase();
  }

  get rolesLabel(): string {
    return this.userInfo?.Roles?.join(', ') || '';
  }

  selectTab(item: ProfileNavItem): void {
    if (!item.available) {
      this.message.info('Mục này đang được phát triển.');
      return;
    }
    this.router.navigate([], {
      relativeTo: this.activatedRoute,
      queryParams: { tab: item.id },
      queryParamsHandling: 'merge',
    });
  }

  private isAvailableTab(tab: string | undefined): boolean {
    if (!tab) {
      return false;
    }
    return this.profileNav.some(section =>
      section.items.some(item => item.id === tab && item.available)
    );
  }
}
