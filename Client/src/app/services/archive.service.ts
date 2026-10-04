import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, switchMap, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  IArchiveBoolResponse,
  IArchiveCollectionResponse,
  IArchiveCollectionSave,
  IArchiveItemCreate,
  IArchiveItemResponse,
  IArchiveItemUpdate,
  IArchiveUploadSignatureResponse,
} from '../interfaces';
import { CloudinaryService, CloudinaryUploadEvent } from './cloudinary.service';

export type ArchiveUploadEvent =
  | { type: 'progress'; percent: number }
  | {
      type: 'done';
      publicId: string;
      secureUrl: string;
      width: number;
      height: number;
      durationSeconds: number | null;
      bytes: number;
      /** Hiệu lực 10 phút - dùng xoá file nếu lưu mục thất bại */
      deleteToken: string | null;
    };

/** API của module Thư viện lưu trữ (bộ sưu tập cá nhân). */
@Injectable({
  providedIn: 'root',
})
export class ArchiveService {
  private http = inject(HttpClient);
  private cloudinary = inject(CloudinaryService);
  private apiUrl = `${environment.apiUrl}archive`;

  myCollections(): Observable<IArchiveCollectionResponse> {
    return this.http.get<IArchiveCollectionResponse>(
      `${this.apiUrl}/mycollections`
    );
  }

  collection(collectionId: string): Observable<IArchiveCollectionResponse> {
    return this.http.get<IArchiveCollectionResponse>(
      `${this.apiUrl}/collection?collectionId=${encodeURIComponent(collectionId)}`
    );
  }

  items(
    collectionId: string,
    pageIndex: number,
    pageSize: number
  ): Observable<IArchiveItemResponse> {
    return this.http.get<IArchiveItemResponse>(
      `${this.apiUrl}/items?collectionId=${encodeURIComponent(collectionId)}&pageIndex=${pageIndex}&pageSize=${pageSize}`
    );
  }

  createCollection(
    request: IArchiveCollectionSave
  ): Observable<IArchiveCollectionResponse> {
    return this.http.post<IArchiveCollectionResponse>(
      `${this.apiUrl}/collection`,
      request
    );
  }

  updateCollection(
    request: IArchiveCollectionSave
  ): Observable<IArchiveCollectionResponse> {
    return this.http.put<IArchiveCollectionResponse>(
      `${this.apiUrl}/collection`,
      request
    );
  }

  deleteCollection(collectionId: string): Observable<IArchiveBoolResponse> {
    return this.http.delete<IArchiveBoolResponse>(
      `${this.apiUrl}/collection?collectionId=${encodeURIComponent(collectionId)}`
    );
  }

  reorderCollection(
    collectionId: string,
    direction: 'up' | 'down'
  ): Observable<IArchiveBoolResponse> {
    return this.http.post<IArchiveBoolResponse>(
      `${this.apiUrl}/reordercollection`,
      { CollectionId: collectionId, Direction: direction }
    );
  }

  createItem(request: IArchiveItemCreate): Observable<IArchiveItemResponse> {
    return this.http.post<IArchiveItemResponse>(`${this.apiUrl}/item`, request);
  }

  updateItem(request: IArchiveItemUpdate): Observable<IArchiveItemResponse> {
    return this.http.put<IArchiveItemResponse>(`${this.apiUrl}/item`, request);
  }

  deleteItem(itemId: string): Observable<IArchiveBoolResponse> {
    return this.http.delete<IArchiveBoolResponse>(
      `${this.apiUrl}/item?itemId=${encodeURIComponent(itemId)}`
    );
  }

  /**
   * Xin chữ ký rồi tải thẳng lên Cloudinary. File chỉ được tải khi người dùng
   * bấm Lưu (không phải lúc chọn file) để hạn chế file mồ côi.
   */
  uploadFile(file: File, kind: 'Image' | 'Video'): Observable<ArchiveUploadEvent> {
    return this.http
      .get<IArchiveUploadSignatureResponse>(
        `${this.apiUrl}/uploadsignature?kind=${kind}`
      )
      .pipe(
        switchMap(response => {
          const signature = response?.Data;
          if (!response?.Success || !signature) {
            return throwError(
              () => new Error(response?.ErrorMessage || 'Không lấy được chữ ký tải file')
            );
          }
          if (file.size > signature.MaxBytes) {
            const maxMb = Math.round(signature.MaxBytes / 1024 / 1024);
            return throwError(
              () => new Error(`File vượt quá dung lượng cho phép (${maxMb} MB)`)
            );
          }
          return this.cloudinary.uploadSignedWithProgress(file, signature);
        }),
        map((event: CloudinaryUploadEvent): ArchiveUploadEvent => {
          if (event.type === 'progress') return event;
          const result = event.result;
          return {
            type: 'done',
            publicId: result.public_id,
            secureUrl: result.secure_url,
            width: result.width,
            height: result.height,
            durationSeconds:
              result.duration != null ? Math.round(result.duration) : null,
            bytes: result.bytes,
            deleteToken: result.delete_token ?? null,
          };
        })
      );
  }

  discardUpload(deleteToken: string | null): void {
    if (!deleteToken) return;
    this.cloudinary.deleteByToken(deleteToken).subscribe({
      error: () => {
        // Token hết hạn / mạng lỗi: file mồ côi chỉ tốn dung lượng, bỏ qua
      },
    });
  }

  /** Khung hình đầu của video làm ảnh đại diện, không phải tải thêm file. */
  videoPosterUrl(secureUrl: string): string {
    return secureUrl
      .replace('/video/upload/', '/video/upload/so_0/')
      .replace(/\.[a-z0-9]+$/i, '.jpg');
  }
}
