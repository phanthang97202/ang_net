import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzPageHeaderModule } from 'ng-zorro-antd/page-header';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzUploadFile, NzUploadModule } from 'ng-zorro-antd/upload';
import { IconCommonComponent } from '../icon-common/icon-common.component';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { Util } from '../../helpers';
import { CloudinaryService } from '../../services';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  standalone: true,
  selector: 'app-upload-common',
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
    TranslateModule,
  ],
  templateUrl: './upload-common.component.html',
  styleUrls: ['./upload-common.component.scss'],
})
export class UploadCommonComponent implements OnChanges {
  cloudinary = inject(CloudinaryService);
  @Output() _onClick = new EventEmitter<MouseEvent>();

  // Ảnh đã lưu của bản ghi. Không có input này thì màn edit không có cách nào
  // hiển thị ảnh cũ, danh sách file luôn rỗng cho tới khi người dùng chọn ảnh mới.
  @Input() imageUrl = '';

  thumnail: NzUploadFile[] = [];
  previewVisible = false;
  previewImage: ArrayBuffer | string | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['imageUrl']) return;
    // Ảnh vừa upload xong cũng quay lại qua input này, nên dựng lại danh sách theo
    // url mới thay vì giữ file tạm mà nz-upload tự thêm vào lúc chọn.
    this.thumnail = this.imageUrl
      ? [
          {
            uid: this.imageUrl,
            name: 'thumbnail',
            status: 'done',
            url: this.imageUrl,
          },
        ]
      : [];
  }

  handleUploadFile = (file: any) => {
    this._onClick.emit(file);
    return true; // Prevent default behavior
  };

  handlePreview = async (file: NzUploadFile): Promise<void> => {
    const extendedFile = file as NzUploadFile & {
      url: string;
      preview: ArrayBuffer | string | null;
      originFileObj: string;
      previewImage: ArrayBuffer | string | null;
    };

    if (!extendedFile.url && !extendedFile.preview) {
      extendedFile.preview = await Util.getBase64(extendedFile.originFileObj!);
    }
    this.previewImage = extendedFile.url || extendedFile.preview;
    this.previewVisible = true;
  };
}
