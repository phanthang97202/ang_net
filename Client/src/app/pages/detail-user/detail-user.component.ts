import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateService } from '@ngx-translate/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd/message';
import { AuthService, ShowErrorService } from '../../services';
import { IUser } from '../../interfaces';
import {
  AntdModule,
  REUSE_COMPONENT_MODULES,
  REUSE_PIPE_MODULE,
} from '../../modules';
import { MyPostsComponent } from './my-posts/my-posts.component';
import { MyArchiveComponent } from './my-archive/my-archive.component';
import { MySecurityComponent } from './my-security/my-security.component';
import { MyReelsComponent } from './my-reels/my-reels.component';

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
  imports: [
    FormsModule,
    AntdModule,
    ...REUSE_COMPONENT_MODULES,
    ...REUSE_PIPE_MODULE,
    MyPostsComponent,
    MyArchiveComponent,
    MySecurityComponent,
    MyReelsComponent,
  ],
  templateUrl: './detail-user.component.html',
  styleUrl: './detail-user.component.scss',
})
export class DetailUserComponent implements OnInit {
  authService = inject(AuthService);
  showErrorService = inject(ShowErrorService);
  private message = inject(NzMessageService);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);
  private translate = inject(TranslateService);

  userInfo: IUser | null = null;
  activeTab = 'profile';
  avatarUrl = '';
  avatarPreview = '';
  avatarLoaded = false;
  avatarFailed = false;
  avatarSaving = false;

  profileNav: ProfileNavSection[] = [
    {
      titleKey: 'T_ACCOUNT',
      items: [
        {
          id: 'profile',
          labelKey: 'T_MYPROFILE',
          icon: 'user',
          available: true,
        },
        {
          id: 'security',
          labelKey: 'T_SECURITY',
          icon: 'safety',
          available: true,
        },
      ],
    },
    {
      titleKey: 'T_CONTENT',
      items: [
        {
          id: 'reels',
          labelKey: 'T_MYREELS',
          icon: 'play-circle',
          available: true,
        },
        { id: 'posts', labelKey: 'T_MYPOSTS', icon: 'read', available: true },
        // Admin cấp quyền dùng thư viện theo vai trò; không có quyền thì ẩn hẳn
        ...(this.authService.hasPermission('archive.use')
          ? [
              {
                id: 'archive',
                labelKey: 'T_MYARCHIVE',
                icon: 'folder-open',
                available: true,
              },
            ]
          : []),
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
        this.setAvatarUrl(res.Data.Avatar || '');
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

  get rolesLabel(): string {
    return this.userInfo?.Roles?.join(', ') || '';
  }

  setAvatarUrl(value: string): void {
    this.avatarUrl = value;
    let preview = '';
    try {
      const url = new URL(value.trim());
      if (
        value.trim().length <= 2048 &&
        url.protocol === 'https:' &&
        !url.username &&
        !url.password
      ) {
        preview = value.trim();
      }
    } catch {
      /* Keep the placeholder until a valid link is entered. */
    }
    if (preview === this.avatarPreview) return;
    this.avatarPreview = preview;
    this.avatarLoaded = false;
    this.avatarFailed = false;
  }

  get avatarChanged(): boolean {
    return this.avatarUrl.trim() !== (this.userInfo?.Avatar || '');
  }

  saveAvatar(): void {
    if (
      !this.avatarLoaded ||
      this.avatarFailed ||
      !this.avatarPreview ||
      !this.avatarChanged ||
      this.avatarSaving
    )
      return;
    this.avatarSaving = true;
    this.authService
      .updateAvatar(this.avatarPreview)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: response => {
          this.avatarSaving = false;
          if (response.Success) {
            this.userInfo = response.Data;
            this.setAvatarUrl(response.Data.Avatar);
            this.message.success(this.translate.instant('T_AVATAR_SAVED'));
          } else {
            this.message.error(
              response.ErrorMessage ||
                this.translate.instant('T_AVATAR_SAVE_ERROR')
            );
          }
        },
        error: () => {
          this.avatarSaving = false;
          this.message.error(this.translate.instant('T_AVATAR_SAVE_ERROR'));
        },
      });
  }

  selectTab(item: ProfileNavItem): void {
    if (!item.available) {
      this.message.info('Mục này đang được phát triển.');
      return;
    }
    this.router.navigate([], {
      relativeTo: this.activatedRoute,
      // Bỏ bộ sưu tập đang mở để quay lại tab thư viện thì về danh sách
      queryParams: { tab: item.id, collection: null },
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
