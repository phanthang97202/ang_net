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

export interface IReelMediaCreateDto {
  MediaUrl: string;
  SortOrder: number;
  DurationSeconds: number | null;
  Width: number | null;
  Height: number | null;
}

export interface IReelCreateRequest {
  Caption: string;
  MediaType: EReelMediaType;
  CoverUrl: string;
  Media: IReelMediaCreateDto[];
}

export type IReelCreateResponse = IBaseResponse<IReelDto>;

export interface IReelViewResult {
  ReelId: string;
  ViewCount: number;
}

export type IReelViewResponse = Omit<IBaseResponse<IReelDto>, 'objResult'> & {
  objResult: IReelViewResult;
};

export interface IReelCommentDto {
  CommentId: string;
  ReelId: string;
  UserId: string;
  UserFullName: string;
  UserAvatar: string;
  ParentCommentId: string | null;
  Content: string;
  ReplyCount: number;
  IsOwnedByMe: boolean;
  CreatedDTime: string;
  Replies: IReelCommentDto[];
}

export interface IReelCommentCreateRequest {
  ReelId: string;
  ParentCommentId: string | null;
  Content: string;
}

export type IReelCommentsResponse = Omit<
  IBaseResponse<IReelCommentDto>,
  'objResult'
> & {
  objResult: ICursorPageInfo<IReelCommentDto>;
};

export type IReelCommentCreateResponse = IBaseResponse<IReelCommentDto>;
