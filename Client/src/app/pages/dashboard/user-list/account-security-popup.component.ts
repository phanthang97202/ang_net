import { CommonModule } from '@angular/common';
import {
  Component,
  DestroyRef,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  Output,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { AuthService } from '../../../services';
import { IUser } from '../../../interfaces';

export type AccountSecurityAction = 'revoke' | 'lock' | 'unlock';

@Component({
  selector: 'app-account-security-popup',
  standalone: true,
  imports: [CommonModule, NzModalModule],
  template: `
    <nz-modal
      [nzVisible]="visible"
      [nzTitle]="title"
      [nzOkText]="title"
      [nzOkDanger]="action !== 'unlock'"
      [nzOkLoading]="saving"
      [nzCancelDisabled]="saving"
      [nzClosable]="!saving"
      [nzMaskClosable]="false"
      nzCancelText="Hủy"
      nzClassName="admin-modal admin-account-security"
      (nzOnCancel)="cancel()"
      (nzOnOk)="save()">
      <ng-container *nzModalContent>
        <p class="security-target">
          {{ user?.FullName }} <span>{{ user?.Email || user?.UserName }}</span>
        </p>
        <p class="security-description">{{ description }}</p>
        <p *ngIf="isSelf" class="security-description">
          Bạn sẽ cần đăng nhập lại sau khi thu hồi phiên của chính mình.
        </p>
        <p *ngIf="error" class="security-error" role="alert">{{ error }}</p>
      </ng-container>
    </nz-modal>
  `,
  styles: [
    `
      .security-target {
        color: var(--admin-text, #172033);
        font-weight: 600;
      }
      .security-target span {
        display: block;
        margin-top: 4px;
        font-weight: 400;
        color: var(--admin-text-secondary, #667085);
      }
      .security-description {
        color: var(--admin-text-secondary, #667085);
        line-height: 1.6;
      }
      .security-error {
        color: var(--admin-danger, #dc2626);
        margin-bottom: 0;
      }
    `,
  ],
})
export class AccountSecurityPopupComponent implements OnChanges {
  private api = inject(AuthService);
  private messages = inject(NzMessageService);
  private destroyRef = inject(DestroyRef);
  @Input() visible = false;
  @Input() user: IUser | null = null;
  @Input() action: AccountSecurityAction = 'revoke';
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() saved = new EventEmitter<void>();
  saving = false;
  error = '';

  get title(): string {
    return this.action === 'lock'
      ? 'Khóa tài khoản'
      : this.action === 'unlock'
        ? 'Mở khóa tài khoản'
        : 'Thu hồi mọi phiên';
  }
  get isSelf(): boolean {
    return this.user?.Id === this.api.getAccountInfo().nameid;
  }
  get description(): string {
    return this.action === 'lock'
      ? 'Mọi phiên đăng nhập sẽ bị thu hồi. Tài khoản không thể đăng nhập bằng mật khẩu hoặc Google và chỉ được mở lại bởi Admin.'
      : this.action === 'unlock'
        ? 'Cho phép tài khoản đăng nhập trở lại. Các phiên cũ vẫn không sử dụng được. Nếu mật khẩu bị lộ, hãy đặt lại mật khẩu trước khi mở khóa.'
        : 'Thu hồi access token và refresh token trên mọi thiết bị. Tài khoản vẫn có thể đăng nhập lại; nếu mật khẩu bị lộ, hãy khóa tài khoản hoặc đặt lại mật khẩu.';
  }
  ngOnChanges(): void {
    this.error = '';
  }
  cancel(): void {
    if (!this.saving) this.visibleChange.emit(false);
  }
  save(): void {
    if (
      this.saving ||
      !this.user ||
      !this.api.isLoggedIn() ||
      !this.api.isAdminPermission()
    )
      return;
    if (this.action === 'lock' && this.isSelf) {
      this.error = 'Không thể tự khóa tài khoản quản trị đang sử dụng.';
      return;
    }
    this.saving = true;
    this.error = '';
    const request =
      this.action === 'revoke'
        ? this.api.revokeAccountSessions(this.user.Id)
        : this.api.setAccountLocked(this.user.Id, this.action === 'lock');
    request
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => (this.saving = false))
      )
      .subscribe({
        next: response => {
          if (!response.Success) {
            this.error =
              response.ErrorMessage || 'Không thể cập nhật tài khoản.';
            return;
          }
          this.messages.success(
            this.action === 'lock'
              ? 'Đã khóa tài khoản và thu hồi mọi phiên.'
              : this.action === 'unlock'
                ? 'Đã mở khóa. Người dùng cần đăng nhập lại.'
                : 'Đã thu hồi mọi phiên đăng nhập.'
          );
          this.visibleChange.emit(false);
          if (this.isSelf) this.api.logout();
          else this.saved.emit();
        },
        error: error =>
          (this.error =
            error?.error?.ErrorMessage ||
            'Không thể cập nhật tài khoản. Vui lòng thử lại.'),
      });
  }
}
