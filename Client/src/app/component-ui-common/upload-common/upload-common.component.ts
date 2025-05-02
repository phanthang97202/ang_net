import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Output } from '@angular/core';
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
export class UploadCommonComponent {
  cloudinary = inject(CloudinaryService);
  @Output() _onClick = new EventEmitter<MouseEvent>();

  thumnail: any;
  previewVisible = false;
  previewImage: ArrayBuffer | string | null = null;

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
