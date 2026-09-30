import { IBaseResponse } from './common';

export type MediaResourceType = 'image' | 'video' | 'raw';

export interface IMediaAsset {
  AssetId: string;
  PublicId: string;
  DisplayName: string;
  SecureUrl: string;
  ResourceType: MediaResourceType;
  Format: string;
  Folder: string;
  Bytes: number;
  Width: number;
  Height: number;
  Duration?: number;
  CreatedAt?: string;
}

export interface IMediaPage {
  Assets: IMediaAsset[];
  NextCursor: string;
}

export interface IMediaUsage {
  Source: string;
  Id: string;
  Title: string;
}

export interface IMediaDeleteRequest {
  PublicId: string;
  SecureUrl: string;
  ResourceType: MediaResourceType;
}

export interface IMediaDeleteResult {
  Deleted: boolean;
  Usages: IMediaUsage[];
}

export type IMediaPageResponse = IBaseResponse<IMediaPage>;
export type IMediaUploadResponse = IBaseResponse<IMediaAsset>;
export type IMediaDeleteResponse = IBaseResponse<IMediaDeleteResult>;
