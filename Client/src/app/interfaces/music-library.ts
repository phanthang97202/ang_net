import { TArchiveVisibility } from './archive';
import { IBaseResponse } from './common';

/** Khớp EMusicProvider ở server. Thêm nguồn mới: thêm giá trị ở đây + adapter phát nhạc. */
export type TMusicProvider = 'YouTube' | 'Audius';
export type TMusicTrackAvailability = 'Available' | 'Unavailable';

/** Khoá nhận diện bài ở nguồn. Server tự lấy tên/ca sĩ/ảnh, client chỉ gửi cặp này. */
export interface IMusicTrackKey {
  Provider: TMusicProvider;
  ExternalId: string;
  TrackId?: string;
}

/** Thông tin hiển thị tạm (toast, modal) trước khi server trả bản chụp chính thức. */
export interface IMusicTrackPreview extends IMusicTrackKey {
  Title: string;
  Artist: string;
  ThumbnailUrl: string;
}

export interface IMusicLibraryTrack {
  TrackId: string;
  Provider: TMusicProvider;
  ExternalId: string;
  Title: string;
  Artist: string;
  ThumbnailUrl: string;
  DurationSeconds: number | null;
  ExternalUrl: string;
  Availability: TMusicTrackAvailability;
  /** Thời điểm lưu (Yêu thích) hoặc thêm vào bộ */
  AddedDTime: string | null;
}

export interface IMusicCollection {
  CollectionId: string;
  OwnerId: string;
  OwnerFullName: string;
  OwnerAvatar: string;
  Name: string;
  Description: string;
  /** Ảnh của bài đứng đầu bộ */
  CoverUrl: string;
  Visibility: TArchiveVisibility;
  SortOrder: number;
  ItemCount: number;
  IsOwner: boolean;
  /** Chỉ có nghĩa khi hỏi kèm bài: bài đó đã nằm trong bộ này chưa */
  ContainsTrack: boolean;
  CreatedDTime: string;
  UpdatedDTime: string;
}

export interface IMusicCollectionSave {
  CollectionId: string;
  Name: string;
  Description: string;
  Visibility: TArchiveVisibility;
}

export type IMusicLibraryTrackResponse = IBaseResponse<IMusicLibraryTrack>;
export type IMusicTrackKeyResponse = IBaseResponse<IMusicTrackKey>;
export type IMusicCollectionResponse = IBaseResponse<IMusicCollection>;
export type IMusicLibraryBoolResponse = IBaseResponse<boolean>;
