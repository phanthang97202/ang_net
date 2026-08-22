import { IBaseResponse } from './common';

export type EReelMediaType = 'Video' | 'Image';

export interface IReelMediaDto {
  ReelMediaId: string;
  MediaUrl: string;
  SortOrder: number;
  DurationSeconds: number | null;
  Width: number | null;
  Height: number | null;
}

export interface IReelDto {
  ReelId: string;
  UserId: string;
  UserFullName: string;
  UserAvatar: string;
  Caption: string;
  MediaType: EReelMediaType;
  CoverUrl: string;
  ViewCount: number;
  LikeCount: number;
  CommentCount: number;
  IsLikedByMe: boolean;
  IsOwnedByMe: boolean;
  CreatedDTime: string;
  Media: IReelMediaDto[];
}

export interface ICursorPageInfo<T> {
  DataList: T[];
  NextCursor: string | null;
  HasMore: boolean;
}

export interface IReelLikeResult {
  ReelId: string;
  Liked: boolean;
  LikeCount: number;
}

// Giữ nguyên phần envelope của IBaseResponse, chỉ thay objResult: ở đây là cursor-based
// (ICursorPageInfo) chứ không phải IPageInfo offset-based mà IBaseResponse giả định.
export type IReelFeedResponse = Omit<IBaseResponse<IReelDto>, 'objResult'> & {
  objResult: ICursorPageInfo<IReelDto>;
};

export type IReelLikeResponse = Omit<IBaseResponse<IReelDto>, 'objResult'> & {
  objResult: IReelLikeResult;
};
