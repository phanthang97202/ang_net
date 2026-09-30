import { Component, ElementRef, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import {
  IMediaAsset,
  IMediaFolder,
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
  folders: IMediaFolder[] = [];
  selectedFolder = '';
  folderName = '';
  showFolderForm = false;
  folderLoading = false;
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
    this.loadFolders();
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
        this.keyword.trim(),
        this.selectedFolder
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

  selectFolder(path: string): void {
    if (path === this.selectedFolder) return;
    this.selectedFolder = path;
    this.keyword = '';
    this.loadAssets(true);
  }

  folderLevel(folder: IMediaFolder): number {
    return Math.max(0, folder.Path.split('/').length - 1);
  }

  openFolderForm(): void {
    this.folderName = '';
    this.showFolderForm = true;
  }

  createFolder(): void {
    const name = this.folderName.trim().replace(/^\/+|\/+$/g, '');
    if (!name) {
      this.message.warning('Vui lòng nhập tên thư mục');
      return;
    }

    const path = this.selectedFolder ? `${this.selectedFolder}/${name}` : name;
    this.folderLoading = true;
    this.api.MediaCreateFolder(path).subscribe({
      next: response => {
        if (response?.Success) {
          this.message.success('Đã tạo thư mục');
          this.showFolderForm = false;
          this.selectedFolder = response.Data?.Path || path;
          this.loadFolders();
          this.loadAssets(true);
        } else {
          this.message.error(response?.ErrorMessage || 'Không thể tạo thư mục');
        }
      },
      error: err => {
        this.folderLoading = false;
        this.message.error(this.errorMessage(err));
      },
      complete: () => (this.folderLoading = false),
    });
  }

  confirmDeleteFolder(): void {
    if (!this.selectedFolder) return;
    const path = this.selectedFolder;
    this.modal.confirm({
      nzTitle: 'Xóa thư mục?',
      nzContent: `Chỉ thư mục rỗng mới có thể xóa. Bạn muốn xóa “${path}”?`,
      nzOkText: 'Xóa thư mục',
      nzOkDanger: true,
      nzCancelText: 'Hủy',
      nzOnOk: () => this.deleteFolder(path),
    });
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
    forkJoin(
      files.map(file => this.api.MediaUpload(file, this.selectedFolder))
    ).subscribe({
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

  private loadFolders(): void {
    this.api.MediaFolders().subscribe({
      next: response => {
        if (response?.Success) {
          this.folders = response.DataList || [];
        } else {
          this.message.error(response?.ErrorMessage || 'Không thể tải thư mục');
        }
      },
      error: err => this.message.error(this.errorMessage(err)),
    });
  }

  private deleteFolder(path: string): Promise<void> {
    return new Promise(resolve => {
      this.api.MediaDeleteFolder(path).subscribe({
        next: response => {
          if (response?.Success) {
            this.message.success('Đã xóa thư mục');
            this.selectedFolder = path.includes('/')
              ? path.slice(0, path.lastIndexOf('/'))
              : '';
            this.loadFolders();
            this.loadAssets(true);
          } else {
            this.message.error(
              response?.ErrorMessage || 'Không thể xóa thư mục'
            );
          }
          resolve();
        },
        error: err => {
          this.message.error(
            err?.error?.ErrorMessage ||
              'Không thể xóa: thư mục có thể vẫn còn file hoặc thư mục con'
          );
          resolve();
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

  private errorMessage(err: unknown): string {
    if (!err || typeof err !== 'object') return 'Đã có lỗi xảy ra';

    const response = err as {
      error?: { ErrorMessage?: unknown };
      message?: unknown;
    };
    const message = response.error?.ErrorMessage ?? response.message;
    return typeof message === 'string' ? message : 'Đã có lỗi xảy ra';
  }
}
