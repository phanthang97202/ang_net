import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpEventType,
  HttpResponse,
} from '@angular/common/http';
import { Observable, filter, map } from 'rxjs';

export interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  resource_type: string;
  format: string;
  width: number;
  height: number;
  duration?: number; // Chỉ có với video, đơn vị giây (số thực)
  bytes: number;
  delete_token?: string; // Chỉ có khi preset bật "Return delete token"
}

export type CloudinaryUploadEvent =
  | { type: 'progress'; percent: number }
  | { type: 'done'; result: CloudinaryUploadResult };

@Injectable({
  providedIn: 'root',
})
export class CloudinaryService {
  private cloudName = 'dumdpgmgs';
  private uploadPreset = 'svylrno1';

  // Preset riêng cho reels: giới hạn định dạng + dung lượng ngay từ Cloudinary,
  // vì preset unsigned nằm lộ trong JS nên đây là tuyến chặn duy nhất.
  private reelVideoPreset = 'reels_video';
  private reelImagePreset = 'reels_image';

  constructor(private http: HttpClient) {}

  uploadImage(file: File) {
    // debugger;
    const formData = new FormData();
    formData.append('file', file);
    // formData.append('file', URL.createObjectURL(file));

    // formData.append('cloud_name', this.cloudName);
    formData.append('upload_preset', this.uploadPreset);

    return this.http.post(
      `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`,
      formData
    );
  }

  uploadReelVideo(file: File): Observable<CloudinaryUploadResult> {
    return this.upload(file, this.reelVideoPreset, 'video');
  }

  uploadReelImage(file: File): Observable<CloudinaryUploadResult> {
    return this.upload(file, this.reelImagePreset, 'image');
  }

  /**
   * Như uploadReelVideo nhưng phát thêm tiến trình. Video reel có thể tới 50MB
   * nên người dùng cần thấy % thay vì màn hình đứng im.
   */
  uploadReelVideoWithProgress(file: File): Observable<CloudinaryUploadEvent> {
    return this.http
      .post<CloudinaryUploadResult>(
        `https://api.cloudinary.com/v1_1/${this.cloudName}/video/upload`,
        this.buildFormData(file, this.reelVideoPreset),
        { reportProgress: true, observe: 'events' }
      )
      .pipe(
        filter(
          event =>
            event.type === HttpEventType.UploadProgress ||
            event.type === HttpEventType.Response
        ),
        map((event): CloudinaryUploadEvent => {
          if (event.type === HttpEventType.UploadProgress) {
            // event.total có thể undefined (server không trả Content-Length) -> tránh NaN%
            return {
              type: 'progress',
              percent: event.total
                ? Math.round((100 * event.loaded) / event.total)
                : 0,
            };
          }
          return {
            type: 'done',
            result: (event as HttpResponse<CloudinaryUploadResult>).body!,
          };
        })
      );
  }

  /**
   * Ảnh bìa lấy từ chính video bằng URL transform (so_0 = khung hình đầu),
   * không phải upload thêm file nào.
   */
  buildVideoPosterUrl(publicId: string): string {
    // Không encodeURIComponent: public_id có chứa '/' của folder (reels/video/abc123)
    return `https://res.cloudinary.com/${this.cloudName}/video/upload/so_0/${publicId}.jpg`;
  }

  /**
   * Xoá asset vừa upload mà không cần API secret. Chỉ dùng được trong 10 phút
   * kể từ lúc upload, sau đó token hết hạn và phải xoá từ phía server.
   * Dùng khi upload xong nhưng tạo reel thất bại / người dùng huỷ, để file không nằm rác trên Cloudinary.
   */
  deleteByToken(token: string): Observable<{ result: string }> {
    return this.http.post<{ result: string }>(
      `https://api.cloudinary.com/v1_1/${this.cloudName}/delete_by_token`,
      { token }
    );
  }

  private upload(
    file: File,
    preset: string,
    resourceType: 'image' | 'video'
  ): Observable<CloudinaryUploadResult> {
    return this.http.post<CloudinaryUploadResult>(
      `https://api.cloudinary.com/v1_1/${this.cloudName}/${resourceType}/upload`,
      this.buildFormData(file, preset)
    );
  }

  private buildFormData(file: File, preset: string): FormData {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', preset);
    return formData;
  }
}
