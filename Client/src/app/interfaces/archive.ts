import { IBaseResponse } from './common';

export type TArchiveVisibility = 'Private' | 'Unlisted' | 'Public';
export type TArchiveItemKind = 'Image' | 'Video' | 'Link';
export type TArchiveProvider =
  | 'Cloudinary'
  | 'YouTube'
  | 'TikTok'
  | 'Facebook'
  | 'Instagram'
  | 'Web';

export interface IArchiveCollection {
  CollectionId: string;
  OwnerId: string;
  OwnerFullName: string;
  OwnerAvatar: string;
  Name: string;
  Description: string;
  /** Ảnh bìa hiển thị (tự chọn, hoặc thumbnail mục mới nhất) */
  CoverUrl: string;
  /** Ảnh bìa chủ sở hữu tự chọn; rỗng = tự động */
  CustomCoverUrl: string;
  Visibility: TArchiveVisibility;
  SortOrder: number;
  ItemCount: number;
  IsOwner: boolean;
  CreatedDTime: string;
  UpdatedDTime: string;
}

export interface IArchiveCollectionSave {
  CollectionId: string;
  Name: string;
  Description: string;
  CoverUrl: string;
  Visibility: TArchiveVisibility;
}

export interface IArchiveItem {
  ItemId: string;
  CollectionId: string;
  Kind: TArchiveItemKind;
  Provider: TArchiveProvider;
  SourceUrl: string;
  Title: string;
  Note: string;
  ThumbnailUrl: string;
  Width: number | null;
  Height: number | null;
  DurationSeconds: number | null;
  Bytes: number | null;
  TakenAt: string | null;
  CreatedDTime: string;
}

export interface IArchiveItemCreate {
  CollectionId: string;
  Kind: TArchiveItemKind;
  SourceUrl: string;
  StoragePublicId: string;
  ThumbnailUrl: string;
  Title: string;
  Note: string;
  Width: number | null;
  Height: number | null;
  DurationSeconds: number | null;
  Bytes: number | null;
  TakenAt: string | null;
}

export interface IArchiveItemUpdate {
  ItemId: string;
  CollectionId: string;
  Title: string;
  Note: string;
  ThumbnailUrl: string;
  TakenAt: string | null;
}

export interface IArchiveUploadSignature {
  UploadUrl: string;
  ApiKey: string;
  Timestamp: number;
  Signature: string;
  PublicId: string;
  AssetFolder: string;
  AllowedFormats: string;
  UploadPreset?: string;
  ReturnDeleteToken: boolean;
  MaxBytes: number;
}

export type IArchiveCollectionResponse = IBaseResponse<IArchiveCollection>;
export type IArchiveItemResponse = IBaseResponse<IArchiveItem>;
export type IArchiveBoolResponse = IBaseResponse<boolean>;
export type IArchiveUploadSignatureResponse =
  IBaseResponse<IArchiveUploadSignature>;
