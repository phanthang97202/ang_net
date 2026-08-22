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
import { IReelCreateRequest } from '../../../../interfaces';

type CreateReelStatus = 'idle' | 'selected' | 'uploading' | 'creating';

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

  // Khớp đúng giới hạn đã khoá ở preset reels_video trên Cloudinary, để người dùng
  // nhận thông báo rõ ràng thay vì lỗi 400 khó hiểu trả về từ Cloudinary.
  readonly maxBytes = 50 * 1024 * 1024;
  readonly allowedExtensions = ['.mp4', '.mov', '.webm'];
  readonly maxCaption = 2000;

  private readonly allowedMimeTypes = [
    'video/mp4',
    'video/quicktime',
    'video/webm',
  ];

  status: CreateReelStatus = 'idle';
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  uploadPercent = 0;
  isDragOver = false;

  validateForm: FormGroup<{ Caption: FormControl<string> }> = this.fb.group({
    // Caption không bắt buộc: server cũng không yêu cầu
    Caption: ['', [Validators.maxLength(this.maxCaption)]],
  });

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  private uploadSub?: Subscription;

  get isBusy(): boolean {
    return this.status === 'uploading' || this.status === 'creating';
  }

  get captionLength(): number {
    return this.validateForm.controls.Caption.value.length;
  }

  get progressLabel(): string {
    if (this.status === 'creating') {
      return 'Đang đăng...';
    }
    // Bytes gửi xong trước khi Cloudinary transcode xong, đứng ở 100% trông như treo
    return this.uploadPercent >= 99
      ? 'Đang xử lý...'
      : `Đang tải lên ${this.uploadPercent}%`;
  }

  ngOnDestroy(): void {
    this.uploadSub?.unsubscribe();
    this.revokePreview();
  }

  openFilePicker(): void {
    if (this.isBusy) {
      return;
    }
    this.fileInput.nativeElement.click();
  }

  onFileInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.acceptFile(file);
    }
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

    const file = event.dataTransfer?.files?.[0];
    if (file) {
      this.acceptFile(file);
    }
  }

  clearFile(): void {
    if (this.isBusy) {
      return;
    }
    this.revokePreview();
    this.selectedFile = null;
    this.status = 'idle';
    this.uploadPercent = 0;
  }

  cancel(): void {
    this.revokePreview();
    this.router.navigate(['/reels']);
  }

  formatSize(bytes: number): string {
    if (bytes >= 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(2)}MB`;
    }
    return `${Math.max(Math.round(bytes / 1024), 1)}KB`;
  }

  submitForm(): void {
    if (!this.selectedFile || this.isBusy) {
      return;
    }

    if (this.validateForm.invalid) {
      this.validateForm.markAllAsTouched();
      return;
    }

    const file = this.selectedFile;
    this.status = 'uploading';
    this.uploadPercent = 0;

    this.uploadSub = this.cloudinary.uploadReelVideoWithProgress(file).subscribe({
      next: event => {
        if (event.type === 'progress') {
          this.uploadPercent = Math.min(event.percent, 99);
        } else {
          this.uploadPercent = 100;
          this.createReel(event.result);
        }
      },
      error: () => {
        this.status = 'selected';
        this.uploadPercent = 0;
        this.showErrorService.setShowError({
          icon: 'warning',
          title: 'Tải video',
          message: 'Tải video lên thất bại. Vui lòng thử lại.',
        });
      },
    });
  }

  private createReel(result: CloudinaryUploadResult): void {
    this.status = 'creating';

    const request: IReelCreateRequest = {
      Caption: this.validateForm.controls.Caption.value.trim(),
      MediaType: 'Video',
      CoverUrl: this.cloudinary.buildVideoPosterUrl(result.public_id),
      Media: [
        {
          MediaUrl: result.secure_url,
          SortOrder: 0,
          // Cloudinary trả số thực, cột DurationSeconds phía server là int?
          DurationSeconds:
            result.duration != null ? Math.round(result.duration) : null,
          Width: result.width ?? null,
          Height: result.height ?? null,
        },
      ],
    };

    this.apiService.ReelCreate(request).subscribe({
      next: res => {
        if (res?.Success) {
          this.message.create('success', 'Đăng reel thành công');
          this.revokePreview();
          this.router.navigate(['/reels']);
          return;
        }

        // Backend trả HTTP 200 kèm Success=false khi lỗi nghiệp vụ
        this.rollbackUpload(result);
        this.status = 'selected';
        this.showErrorService.setShowError({
          icon: 'warning',
          title: 'Đăng reel',
          message: res?.ErrorMessage || 'Đăng reel thất bại.',
        });
      },
      error: () => {
        this.rollbackUpload(result);
        this.status = 'selected';
        this.showErrorService.setShowError({
          icon: 'warning',
          title: 'Đăng reel',
          message: 'Đăng reel thất bại. Vui lòng thử lại.',
        });
      },
    });
  }

  /** Video đã nằm trên Cloudinary nhưng không có bản ghi nào trỏ tới -> xoá luôn cho khỏi rác. */
  private rollbackUpload(result: CloudinaryUploadResult): void {
    if (!result.delete_token) {
      return;
    }
    this.cloudinary.deleteByToken(result.delete_token).subscribe({
      error: () => {
        // Dọn dẹp thất bại thì thôi, không làm phiền người dùng thêm lần nữa
      },
    });
  }

  private acceptFile(file: File): void {
    const error = this.validateVideo(file);
    if (error) {
      this.showErrorService.setShowError({
        icon: 'warning',
        title: 'Chọn video',
        message: error,
      });
      return;
    }

    this.revokePreview();
    this.selectedFile = file;
    this.previewUrl = URL.createObjectURL(file);
    this.status = 'selected';
    this.uploadPercent = 0;
  }

  private validateVideo(file: File): string | null {
    const name = file.name.toLowerCase();
    const hasAllowedExtension = this.allowedExtensions.some(ext =>
      name.endsWith(ext)
    );
    // Chấp nhận nếu đuôi file HOẶC MIME hợp lệ: Windows báo MIME của .mov
    // lúc là video/quicktime lúc rỗng, xét một chiều sẽ từ chối nhầm.
    const hasAllowedMime = this.allowedMimeTypes.includes(file.type);

    if (!hasAllowedExtension && !hasAllowedMime) {
      return 'Định dạng không hỗ trợ. Chỉ nhận mp4, mov, webm.';
    }

    if (file.size > this.maxBytes) {
      return 'Video vượt quá 50MB. Vui lòng chọn video nhỏ hơn.';
    }

    return null;
  }

  private revokePreview(): void {
    if (this.previewUrl) {
      URL.revokeObjectURL(this.previewUrl);
      this.previewUrl = null;
    }
  }
}
