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

@Component({
  standalone: true,
  selector: 'import-excel-popup',
  imports: [NzModalModule, NzUploadModule, NzButtonModule, NzIconModule],
  templateUrl: './import-excel-popup.component.html',
  styleUrl: './import-excel-popup.component.scss',
})
export class ImportExcelPopup implements OnChanges {
  @Input() isOpenPopup!: boolean;
  @Output() isOpenPopupChange = new EventEmitter<boolean>();

  // defaultFileList: NzUploadFile[] = [
  //   {
  //     uid: '-1',
  //     name: 'xxx.png',
  //     status: 'done',
  //     url: 'https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png',
  //     thumbUrl:
  //       'https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png',
  //   },
  // ];

  fileList: NzUploadFile[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    console.log('🚀 ~ ImportExcelPopup ~ ngOnChanges ~ changes:', changes);
  }

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
}
