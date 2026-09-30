import { Component, ElementRef, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import {
  IMediaAsset,
  IMediaUsage,
  MediaResourceType,
} from '../../../interfaces';
import { AntdModule, REUSE_COMPONENT_MODULES } from '../../../modules';
import { ApiService, AuthService } from '../../../services';

@Component({
  selector: 'app-media-library',
  standalone: true,
  imports: [AntdModule, FormsModule, NzEmptyModule, ...REUSE_COMPONENT_MODULES],
  templateUrl: './media-library.component.html',
  styleUrl: './media-library.component.scss',
})
export class MediaLibraryComponent {
  @ViewChild('fileInput') fileInput?: ElementRef<HTMLInputElement>;

  private api = inject(ApiService);
  private authService = inject(AuthService);
  private message = inject(NzMessageService);
  private modal = inject(NzModalService);

  assets: IMediaAsset[] = [];
  resourceType: MediaResourceType = 'image';
  keyword = '';
  loading = false;
  uploading = false;
  nextCursor = '';
  currentCursor = '';
  private cursorHistory: string[] = [];

  readonly resourceTypes: {
    value: MediaResourceType;
    label: string;
    icon: string;
  }[] = [
    { value: 'image', label: 'Hình ảnh', icon: 'picture' },
    { value: 'video', label: 'Video', icon: 'video-camera' },
    { value: 'raw', label: 'Tệp khác', icon: 'file' },
  ];

  constructor() {
    this.loadAssets(true);
  }

  get canUpload(): boolean {
    return this.authService.hasPermission('media.upload');
  }

  get canDelete(): boolean {
    return this.authService.hasPermission('media.delete');
  }

  get canGoBack(): boolean {
    return this.cursorHistory.length > 0;
  }

  changeResourceType(type: MediaResourceType): void {
    if (type === this.resourceType) return;
    this.resourceType = type;
    this.keyword = '';
    this.loadAssets(true);
  }

  search(): void {
    this.loadAssets(true);
  }

  clearSearch(): void {
    if (!this.keyword) return;
    this.keyword = '';
    this.loadAssets(true);
  }

  loadAssets(reset = false): void {
    if (reset) {
      this.currentCursor = '';
      this.cursorHistory = [];
    }

    this.loading = true;
    this.api
      .MediaSearch(
        this.resourceType,
        24,
        this.currentCursor,
        this.keyword.trim()
      )
      .subscribe({
        next: response => {
          if (response?.Success) {
            this.assets = response.Data?.Assets || [];
            this.nextCursor = response.Data?.NextCursor || '';
          } else {
            this.message.error(
              response?.ErrorMessage || 'Không thể tải thư viện media'
            );
          }
        },
        error: err => {
          this.loading = false;
          this.message.error(this.errorMessage(err));
        },
        complete: () => (this.loading = false),
      });
  }

  nextPage(): void {
    if (!this.nextCursor) return;
    this.cursorHistory.push(this.currentCursor);
    this.currentCursor = this.nextCursor;
    this.loadAssets();
  }

  previousPage(): void {
    const cursor = this.cursorHistory.pop();
    if (cursor === undefined) return;
    this.currentCursor = cursor;
    this.loadAssets();
  }

  openFilePicker(): void {
    this.fileInput?.nativeElement.click();
  }

  uploadFiles(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files || []);
    input.value = '';
    if (!files.length) return;
    if (files.some(file => file.size > 50 * 1024 * 1024)) {
      this.message.warning('Mỗi file được phép có dung lượng tối đa 50 MB');
      return;
    }

    this.uploading = true;
    forkJoin(files.map(file => this.api.MediaUpload(file))).subscribe({
      next: responses => {
        const uploaded = responses.filter(x => x?.Success).length;
        this.message.success(`Đã tải lên ${uploaded}/${files.length} file`);
        this.loadAssets(true);
      },
      error: err => {
        this.uploading = false;
        this.message.error(this.errorMessage(err));
      },
      complete: () => (this.uploading = false),
    });
  }

  async copyUrl(asset: IMediaAsset): Promise<void> {
    try {
      await navigator.clipboard.writeText(asset.SecureUrl);
      this.message.success('Đã sao chép đường dẫn');
    } catch {
      this.message.error('Trình duyệt không cho phép sao chép đường dẫn');
    }
  }

  confirmDelete(asset: IMediaAsset): void {
    this.modal.confirm({
      nzTitle: 'Xóa file khỏi Cloudinary?',
      nzContent: `File “${this.assetName(asset)}” sẽ bị xóa vĩnh viễn nếu không được nội dung nào sử dụng.`,
      nzOkText: 'Xóa file',
      nzOkDanger: true,
      nzCancelText: 'Hủy',
      nzOnOk: () => this.deleteAsset(asset),
    });
  }

  assetName(asset: IMediaAsset): string {
    return (
      asset.DisplayName || asset.PublicId.split('/').pop() || asset.PublicId
    );
  }

  formatBytes(bytes: number): string {
    if (!bytes) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const index = Math.min(
      Math.floor(Math.log(bytes) / Math.log(1024)),
      units.length - 1
    );
    return `${(bytes / Math.pow(1024, index)).toFixed(index ? 1 : 0)} ${
      units[index]
    }`;
  }

  private deleteAsset(asset: IMediaAsset): Promise<void> {
    return new Promise((resolve, reject) => {
      this.api
        .MediaDelete({
          PublicId: asset.PublicId,
          SecureUrl: asset.SecureUrl,
          ResourceType: asset.ResourceType,
        })
        .subscribe({
          next: response => {
            if (response?.Success && response.Data?.Deleted) {
              this.message.success('Đã xóa file');
              this.assets = this.assets.filter(
                x => x.AssetId !== asset.AssetId
              );
              resolve();
              return;
            }
            this.message.error(response?.ErrorMessage || 'Không thể xóa file');
            reject(new Error(response?.ErrorMessage));
          },
          error: err => {
            const usages = (err?.error?.Data?.Usages || []) as IMediaUsage[];
            if (usages.length) {
              this.showUsages(usages);
            } else {
              this.message.error(this.errorMessage(err));
            }
            reject(err);
          },
        });
    });
  }

  private showUsages(usages: IMediaUsage[]): void {
    const content = usages
      .map(x => `${x.Source}: ${x.Title || x.Id}`)
      .join('\n');
    this.modal.warning({
      nzTitle: 'File đang được sử dụng',
      nzContent: content,
      nzOkText: 'Đã hiểu',
    });
  }

  private errorMessage(err: any): string {
    return err?.error?.ErrorMessage || err?.message || 'Đã có lỗi xảy ra';
  }
}
