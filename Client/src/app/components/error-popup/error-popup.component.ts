import {
  Component,
  inject,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { NzButtonComponent } from 'ng-zorro-antd/button';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { ShowErrorService } from '../../services/show-error.service';
import { IErrorInfo } from '../../interfaces/error-info';

@Component({
  standalone: true,
  selector: 'error-popup',
  imports: [NzButtonComponent, NzModalModule],
  template: ``,
})
export class ErrorPopupComponent implements OnChanges {
  @Input() errorInfo: IErrorInfo = {
    title: '',
    icon: '',
    message: '',
  };
  errorInfoService = inject(ShowErrorService);

  constructor(private modal: NzModalService) {}

  showConfirm() {
    this.modal.error({
      nzIconType: this.errorInfo.icon || 'error',
      nzTitle: this.errorInfo.title,
      nzContent: `<pre>${this.errorInfo.message}</pre>`,
      nzCentered: true,
      nzOnOk: () => {
        this.errorInfoService.setShowError({
          title: '',
          icon: '',
          message: '',
        });
      },
    });
  }

  ngOnChanges(change: SimpleChanges) {
    if (!!change['errorInfo'].currentValue.message) {
      this.showConfirm();
    }
  }
}
