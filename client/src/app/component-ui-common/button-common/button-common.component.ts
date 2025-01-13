import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzPageHeaderModule } from 'ng-zorro-antd/page-header';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzUploadModule } from 'ng-zorro-antd/upload';
// import { IButtonCommon } from '../../interfaces/common';
import { IconCommonComponent } from '../icon-common/icon-common.component';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';

@Component({
  standalone: true,
  selector: 'app-button-common',
  imports: [
    NzModalModule,
    NzUploadModule,
    NzButtonModule,
    NzIconModule,
    CommonModule,
    NzPageHeaderModule,
    NzSpaceModule,
    IconCommonComponent,
    NzPopconfirmModule,
  ],
  templateUrl: './button-common.component.html',
  styleUrls: ['./button-common.component.scss'],
})
export class ButtonCommonComponent {
  // @Input() props: IButtonCommon = { iconType: 'plus' };
  @Output() _onClick = new EventEmitter<MouseEvent>();

  @Input() class?: string = '';
  @Input() text?: string = '';
  @Input() nzType: 'primary' | 'default' | 'dashed' | 'text' | 'link' =
    'primary';
  @Input() nzShape: 'circle' | 'round' | null = null;
  @Input() nzSize: 'large' | 'small' | 'default' = 'default';
  @Input() disabled = false;
  @Input() iconType = '';
  @Input() iconTheme: 'fill' | 'outline' | 'twotone' = 'outline';
  // @Input() onClick?: (event: MouseEvent) => void;
  @Input() nzBlock = false;
  @Input() nzDanger = false;
  @Input() nzLoading = false;
  @Input() nzGhost = false;
  @Input() isShowConfirm = false;

  handleClick(event: MouseEvent) {
    if (this.isShowConfirm === false) {
      // this._onClick.emit();
      this.confirm();
    }
  }

  confirm() {
    this._onClick.emit();
  }
  cancel() {
    return;
  }
}
