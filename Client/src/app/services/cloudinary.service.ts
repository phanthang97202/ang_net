import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', preset);

    return this.http.post<CloudinaryUploadResult>(
      `https://api.cloudinary.com/v1_1/${this.cloudName}/${resourceType}/upload`,
      formData
    );
  }
}
