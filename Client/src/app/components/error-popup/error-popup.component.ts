import {
  Component,
  inject,
  Input,
  OnChanges,
  SimpleChanges,
  OnDestroy,
} from '@angular/core';
import { NzButtonComponent } from 'ng-zorro-antd/button';
import { NzModalModule, NzModalRef, NzModalService } from 'ng-zorro-antd/modal';
import { ShowErrorService, IErrorInfoWithId } from '../../services';

@Component({
  standalone: true,
  selector: 'app-error-popup',
  imports: [NzButtonComponent, NzModalModule],
  template: ``,
})
export class ErrorPopupComponent implements OnChanges, OnDestroy {
  @Input() errorInfo: IErrorInfoWithId = {
    title: '',
    icon: '',
    message: '',
  };

  errorInfoService = inject(ShowErrorService);
  private currentModal: NzModalRef | null = null;
  private lastErrorId: number | undefined = undefined; // Track ID thay vì message

  constructor(private modal: NzModalService) {}

  showConfirm() {
    // Đóng modal cũ nếu có
    if (this.currentModal) {
      this.currentModal.destroy();
      this.currentModal = null;
    }

    // Lưu ID hiện tại
    this.lastErrorId = this.errorInfo.id;

    // Tạo modal mới
    this.currentModal = this.modal.error({
      nzIconType: this.errorInfo.icon || 'error',
      nzTitle: this.errorInfo.title || 'Lỗi',
      nzContent: `<pre style="white-space: pre-wrap; word-wrap: break-word; max-height: 400px; overflow-y: auto;">${this.errorInfo.message}</pre>`,
      nzCentered: true,
      nzOnOk: () => this.closeModal(),
      nzOnCancel: () => this.closeModal(),
    });

    this.currentModal.afterClose.subscribe(() => {
      this.closeModal();
    });
  }

  private closeModal() {
    this.currentModal = null;
    this.errorInfoService.clearError();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['errorInfo']) {
      const current = changes['errorInfo'].currentValue;

      // Hiển thị khi:
      // 1. Có message
      // 2. ID khác với ID trước đó (hoặc lần đầu)
      if (
        current?.message &&
        current.message !== '' &&
        current.id !== this.lastErrorId
      ) {
        this.showConfirm();
      }
    }
  }

  ngOnDestroy() {
    if (this.currentModal) {
      this.currentModal.destroy();
      this.currentModal = null;
    }
  }
}
