import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzUploadFile, NzUploadModule } from 'ng-zorro-antd/upload';
import { ButtonCommonComponent } from '../../component-ui-common/button-common/button-common.component';
import { IsViewDirective } from '../../directives/is-view.directive';

@Component({
  standalone: true,
  selector: 'import-excel-popup',
  imports: [
    NzModalModule,
    NzUploadModule,
    NzButtonModule,
    NzIconModule,
    CommonModule,
    ButtonCommonComponent,
    IsViewDirective,
  ],
  templateUrl: './import-excel-popup.component.html',
  styleUrl: './import-excel-popup.component.scss',
})
export class ImportExcelPopup {
  @Input() isOpenPopup!: boolean;
  @Output() isOpenPopupChange = new EventEmitter<boolean>();
  @Output() _onUploadFile = new EventEmitter<NzUploadFile[]>();
  @Output() _onExportTemplateFile = new EventEmitter();

  fileList: NzUploadFile[] = [];

  // ngOnChanges(changes: SimpleChanges): void {}

  showModal(): void {
    this.isOpenPopup = true;
  }

  handleOk(): void {
    setTimeout(() => {
      this.isOpenPopup = false;
    }, 3000);
  }

  handleCancel(): void {
    this.isOpenPopup = false;
    this.isOpenPopupChange.emit(this.isOpenPopup);
  }

  handleUploadFile(ev: MouseEvent) {
    this._onUploadFile.emit(this.fileList);
  }

  handleExportTemplateFile(ev: MouseEvent) {
    this._onExportTemplateFile.emit();
  }
}
