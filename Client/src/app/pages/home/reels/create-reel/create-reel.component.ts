import { Component, ElementRef, OnDestroy, ViewChild, inject } from '@angular/core';
import {
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { Subscription } from 'rxjs';
import {
  ApiService,
  CloudinaryService,
  CloudinaryUploadResult,
  ShowErrorService,
} from '../../../../services';
import { IReelCreateRequest, IReelMediaCreateDto } from '../../../../interfaces';

type CreateReelStatus = 'idle' | 'selected' | 'uploading' | 'creating';
type CreateReelMode = 'video' | 'image';

interface SelectedImage {
  file: File;
  previewUrl: string;
}

@Component({
  selector: 'app-create-reel',
  standalone: true,
  imports: [ReactiveFormsModule, NzIconModule],
  templateUrl: './create-reel.component.html',
  styleUrl: './create-reel.component.scss',
})
export class CreateReelComponent implements OnDestroy {
  private fb = inject(NonNullableFormBuilder);
  private router = inject(Router);
  private apiService = inject(ApiService);
  private cloudinary = inject(CloudinaryService);
  private showErrorService = inject(ShowErrorService);
  private message = inject(NzMessageService);

  // Khớp đúng giới hạn đã khoá ở 2 preset trên Cloudinary, để người dùng nhận
  // thông báo rõ ràng thay vì lỗi 400 khó hiểu trả về từ Cloudinary.
  readonly maxVideoBytes = 50 * 1024 * 1024;
  readonly maxImageBytes = 10 * 1024 * 1024;
  readonly allowedVideoExtensions = ['.mp4', '.mov', '.webm'];
  readonly allowedImageExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
  // Mỗi ảnh tối đa 10MB nên trần này giữ một bài đăng dưới ~100MB, tránh đốt quota
  readonly maxImages = 10;
  readonly maxCaption = 2000;

  private readonly allowedVideoMimeTypes = [
    'video/mp4',
    'video/quicktime',
    'video/webm',
  ];
  private readonly allowedImageMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
  ];

  mode: CreateReelMode = 'video';
  status: CreateReelStatus = 'idle';
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  selectedImages: SelectedImage[] = [];
  uploadPercent = 0;
  /** 1-based, chỉ dùng ở chế độ ảnh để hiện "Đang tải ảnh 2/5" */
  uploadingImageIndex = 0;
  isDragOver = false;

  validateForm: FormGroup<{ Caption: FormControl<string> }> = this.fb.group({
    // Caption không bắt buộc: server cũng không yêu cầu
    Caption: ['', [Validators.maxLength(this.maxCaption)]],
  });

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  private uploadSub?: Subscription;
  /** Ảnh đã lên Cloudinary trong lượt đăng hiện tại, để rollback nếu Create hỏng */
  private uploadedResults: CloudinaryUploadResult[] = [];

  get isImageMode(): boolean {
    return this.mode === 'image';
  }

  get isBusy(): boolean {
    return this.status === 'uploading' || this.status === 'creating';
  }

  get captionLength(): number {
    return this.validateForm.controls.Caption.value.length;
  }

  get hasSelection(): boolean {
    return this.isImageMode
      ? this.selectedImages.length > 0
      : this.selectedFile !== null;
  }

  get acceptAttr(): string {
    return this.isImageMode
      ? 'image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp'
      : 'video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm';
  }

  get progressLabel(): string {
    if (this.status === 'creating') {
      return 'Đang đăng...';
    }
    if (this.isImageMode) {
      return `Đang tải ảnh ${this.uploadingImageIndex}/${this.selectedImages.length} (${this.uploadPercent}%)`;
    }
    // Bytes gửi xong trước khi Cloudinary transcode xong, đứng ở 100% trông như treo
    return this.uploadPercent >= 99
      ? 'Đang xử lý...'
      : `Đang tải lên ${this.uploadPercent}%`;
  }

  ngOnDestroy(): void {
    this.uploadSub?.unsubscribe();
    this.revokeAllPreviews();
  }

  setMode(mode: CreateReelMode): void {
    if (this.isBusy || this.mode === mode) {
      return;
    }
    // Đổi chế độ thì bỏ hết lựa chọn cũ: video và ảnh không dùng chung được
    this.revokeAllPreviews();
    this.mode = mode;
    this.selectedFile = null;
    this.selectedImages = [];
    this.status = 'idle';
    this.uploadPercent = 0;
  }

  openFilePicker(): void {
    if (this.isBusy) {
      return;
    }
    this.fileInput.nativeElement.click();
  }

  onFileInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.acceptFiles(input.files);
    // Reset để chọn lại đúng file vừa rồi vẫn kích hoạt change
    input.value = '';
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (!this.isBusy) {
      this.isDragOver = true;
    }
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    if (this.isBusy) {
      return;
    }
    this.acceptFiles(event.dataTransfer?.files ?? null);
  }

  clearFile(): void {
    if (this.isBusy) {
      return;
    }
    this.revokeAllPreviews();
    this.selectedFile = null;
    this.selectedImages = [];
    this.status = 'idle';
    this.uploadPercent = 0;
  }

  removeImage(index: number): void {
    if (this.isBusy) {
      return;
    }
    const [removed] = this.selectedImages.splice(index, 1);
    if (removed) {
      URL.revokeObjectURL(removed.previewUrl);
    }
    if (this.selectedImages.length === 0) {
      this.status = 'idle';
    }
  }

  /** Thứ tự ảnh chính là thứ tự trình chiếu, nên cho phép sắp xếp lại trước khi đăng */
  moveImage(index: number, offset: number): void {
    const target = index + offset;
    if (this.isBusy || target < 0 || target >= this.selectedImages.length) {
      return;
    }
    const list = [...this.selectedImages];
    [list[index], list[target]] = [list[target], list[index]];
    this.selectedImages = list;
  }

  cancel(): void {
    this.revokeAllPreviews();
    this.router.navigate(['/reels']);
  }

  formatSize(bytes: number): string {
    if (bytes >= 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(2)}MB`;
    }
    return `${Math.max(Math.round(bytes / 1024), 1)}KB`;
  }

  submitForm(): void {
    if (!this.hasSelection || this.isBusy) {
      return;
    }

    if (this.validateForm.invalid) {
      this.validateForm.markAllAsTouched();
      return;
    }

    this.status = 'uploading';
    this.uploadPercent = 0;
    this.uploadedResults = [];

    if (this.isImageMode) {
      this.uploadImageAt(0);
    } else {
      this.uploadVideo();
    }
  }

  private uploadVideo(): void {
    const file = this.selectedFile!;

    this.uploadSub = this.cloudinary.uploadReelVideoWithProgress(file).subscribe({
      next: event => {
        if (event.type === 'progress') {
          this.uploadPercent = Math.min(event.percent, 99);
          return;
        }
        this.uploadPercent = 100;
        this.uploadedResults = [event.result];
        this.createReel([
          {
            MediaUrl: event.result.secure_url,
            SortOrder: 0,
            // Cloudinary trả số thực, cột DurationSeconds phía server là int?
            DurationSeconds:
              event.result.duration != null
                ? Math.round(event.result.duration)
                : null,
            Width: event.result.width ?? null,
            Height: event.result.height ?? null,
          },
        ]);
      },
      error: () => this.failUpload('Tải video lên thất bại. Vui lòng thử lại.'),
    });
  }

  /**
   * Tải tuần tự từng ảnh chứ không song song: dễ báo tiến trình "ảnh i/N", và khi
   * một ảnh hỏng thì chỉ phải dọn những ảnh đã lên trước đó.
   */
  private uploadImageAt(index: number): void {
    if (index >= this.selectedImages.length) {
      this.createReel(
        this.uploadedResults.map((result, i) => ({
          MediaUrl: result.secure_url,
          SortOrder: i,
          DurationSeconds: null,
          Width: result.width ?? null,
          Height: result.height ?? null,
        }))
      );
      return;
    }

    this.uploadingImageIndex = index + 1;
    this.uploadPercent = 0;

    this.uploadSub = this.cloudinary
      .uploadReelImageWithProgress(this.selectedImages[index].file)
      .subscribe({
        next: event => {
          if (event.type === 'progress') {
            this.uploadPercent = event.percent;
            return;
          }
          this.uploadedResults.push(event.result);
          this.uploadImageAt(index + 1);
        },
        error: () => {
          this.rollbackUploads();
          this.failUpload(
            `Tải ảnh thứ ${index + 1} thất bại. Vui lòng thử lại.`
          );
        },
      });
  }

  private createReel(media: IReelMediaCreateDto[]): void {
    this.status = 'creating';

    const request: IReelCreateRequest = {
      Caption: this.validateForm.controls.Caption.value.trim(),
      MediaType: this.isImageMode ? 'Image' : 'Video',
      CoverUrl: this.isImageMode
        ? media[0].MediaUrl // ảnh đầu làm bìa
        : this.cloudinary.buildVideoPosterUrl(this.uploadedResults[0].public_id),
      Media: media,
    };

    this.apiService.ReelCreate(request).subscribe({
      next: res => {
        if (res?.Success) {
          this.message.create('success', 'Đăng reel thành công');
          this.revokeAllPreviews();
          this.router.navigate(['/reels']);
          return;
        }

        // Backend trả HTTP 200 kèm Success=false khi lỗi nghiệp vụ
        this.rollbackUploads();
        this.status = 'selected';
        this.showErrorService.setShowError({
          icon: 'warning',
          title: 'Đăng reel',
          message: res?.ErrorMessage || 'Đăng reel thất bại.',
        });
      },
      error: () => {
        this.rollbackUploads();
        this.status = 'selected';
        this.showErrorService.setShowError({
          icon: 'warning',
          title: 'Đăng reel',
          message: 'Đăng reel thất bại. Vui lòng thử lại.',
        });
      },
    });
  }

  private failUpload(message: string): void {
    this.status = 'selected';
    this.uploadPercent = 0;
    this.uploadingImageIndex = 0;
    this.showErrorService.setShowError({
      icon: 'warning',
      title: 'Tải lên',
      message,
    });
  }

  /** File đã nằm trên Cloudinary nhưng không có bản ghi nào trỏ tới -> xoá cho khỏi rác. */
  private rollbackUploads(): void {
    this.uploadedResults.forEach(result => {
      if (!result.delete_token) {
        return;
      }
      this.cloudinary.deleteByToken(result.delete_token).subscribe({
        error: () => {
          // Dọn dẹp thất bại thì thôi, không làm phiền người dùng thêm lần nữa
        },
      });
    });
    this.uploadedResults = [];
  }

  private acceptFiles(fileList: FileList | null): void {
    const files = Array.from(fileList ?? []);
    if (files.length === 0) {
      return;
    }

    if (this.isImageMode) {
      this.acceptImages(files);
    } else {
      this.acceptVideo(files[0]);
    }
  }

  private acceptVideo(file: File): void {
    const error = this.validateVideo(file);
    if (error) {
      this.showErrorService.setShowError({
        icon: 'warning',
        title: 'Chọn video',
        message: error,
      });
      return;
    }

    this.revokeAllPreviews();
    this.selectedFile = file;
    this.previewUrl = URL.createObjectURL(file);
    this.status = 'selected';
    this.uploadPercent = 0;
  }

  private acceptImages(files: File[]): void {
    const remaining = this.maxImages - this.selectedImages.length;
    if (remaining <= 0) {
      this.showErrorService.setShowError({
        icon: 'warning',
        title: 'Chọn ảnh',
        message: `Chỉ đăng được tối đa ${this.maxImages} ảnh mỗi bài.`,
      });
      return;
    }

    const accepted: SelectedImage[] = [];
    const rejected: string[] = [];

    files.slice(0, remaining).forEach(file => {
      const error = this.validateImage(file);
      if (error) {
        rejected.push(`${file.name}: ${error}`);
        return;
      }
      accepted.push({ file, previewUrl: URL.createObjectURL(file) });
    });

    if (accepted.length > 0) {
      this.selectedImages = [...this.selectedImages, ...accepted];
      this.status = 'selected';
      this.uploadPercent = 0;
    }

    // Báo gộp một lần thay vì bắn nhiều popup khi chọn nhầm cả thư mục
    const skipped = files.length - Math.min(files.length, remaining);
    if (rejected.length > 0 || skipped > 0) {
      const lines = [...rejected];
      if (skipped > 0) {
        lines.push(`Bỏ qua ${skipped} ảnh vượt quá giới hạn ${this.maxImages} ảnh.`);
      }
      this.showErrorService.setShowError({
        icon: 'warning',
        title: 'Một số ảnh không dùng được',
        message: lines.join('\n'),
      });
    }
  }

  private validateVideo(file: File): string | null {
    const name = file.name.toLowerCase();
    const hasAllowedExtension = this.allowedVideoExtensions.some(ext =>
      name.endsWith(ext)
    );
    // Chấp nhận nếu đuôi file HOẶC MIME hợp lệ: Windows báo MIME của .mov
    // lúc là video/quicktime lúc rỗng, xét một chiều sẽ từ chối nhầm.
    const hasAllowedMime = this.allowedVideoMimeTypes.includes(file.type);

    if (!hasAllowedExtension && !hasAllowedMime) {
      return 'Định dạng không hỗ trợ. Chỉ nhận mp4, mov, webm.';
    }

    if (file.size > this.maxVideoBytes) {
      return 'Video vượt quá 50MB. Vui lòng chọn video nhỏ hơn.';
    }

    return null;
  }

  private validateImage(file: File): string | null {
    const name = file.name.toLowerCase();
    const hasAllowedExtension = this.allowedImageExtensions.some(ext =>
      name.endsWith(ext)
    );
    const hasAllowedMime = this.allowedImageMimeTypes.includes(file.type);

    if (!hasAllowedExtension && !hasAllowedMime) {
      return 'chỉ nhận jpg, png, webp';
    }

    if (file.size > this.maxImageBytes) {
      return 'vượt quá 10MB';
    }

    return null;
  }

  private revokeAllPreviews(): void {
    if (this.previewUrl) {
      URL.revokeObjectURL(this.previewUrl);
      this.previewUrl = null;
    }
    this.selectedImages.forEach(image => URL.revokeObjectURL(image.previewUrl));
  }
}
