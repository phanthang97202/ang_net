import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NzUploadFile } from 'ng-zorro-antd/upload';
import {
  AntdModule,
  REUSE_COMPONENT_MODULES,
  REUSE_PIPE_MODULE,
} from '../../modules';

@Component({
  standalone: true,
  selector: 'app-import-excel-popup',
  imports: [AntdModule, ...REUSE_COMPONENT_MODULES, REUSE_PIPE_MODULE],

  templateUrl: './import-excel-popup.component.html',
  styleUrl: './import-excel-popup.component.scss',
})
export class ImportExcelPopupComponent {
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
