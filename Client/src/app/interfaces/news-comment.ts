import { IBaseResponse, IPageInfo } from './common';

export type ENewsCommentSort = 'Popular' | 'Newest';

export type ENewsCommentReportReason =
  | 'Spam'
  | 'HateSpeech'
  | 'Violence'
  | 'Nudity'
  | 'FakeNews'
  | 'Harassment'
  | 'Other';

export interface INewsCommentDto {
  CommentId: string;
  NewsId: string;
  UserId: string;
  UserFullName: string;
  UserAvatar: string;
  ParentCommentId: string | null;
  Content: string;
  LikeCount: number;
  ReplyCount: number;
  IsLikedByMe: boolean;
  IsOwnedByMe: boolean;
  /** Bị ẩn do báo cáo quá ngưỡng hoặc tác giả bị vô hiệu hoá; Content rỗng */
  IsHidden: boolean;
  CreatedDTime: string;
  Replies: INewsCommentDto[];
}

export interface INewsCommentCreateRequest {
  NewsId: string;
  ParentCommentId: string | null;
  Content: string;
}

export interface INewsCommentReportRequest {
  CommentId: string;
  Reason: ENewsCommentReportReason;
  Description: string;
}

// Data mang tổng số bình luận mọi cấp (dùng cho tiêu đề), objResult là trang bình luận gốc
export interface INewsCommentsResponse
  extends IBaseResponse<INewsCommentDto> {
  objResult: IPageInfo<INewsCommentDto>;
}

export interface INewsCommentLikeResult {
  CommentId: string;
  Liked: boolean;
  LikeCount: number;
}

export type INewsCommentLikeResponse = Omit<
  IBaseResponse<INewsCommentDto>,
  'objResult'
> & {
  objResult: INewsCommentLikeResult;
};

export interface INewsCommentReportResult {
  CommentId: string;
  Created: boolean;
  ReportCount: number;
  AutoHidden: boolean;
}

export type INewsCommentReportResponse = Omit<
  IBaseResponse<INewsCommentDto>,
  'objResult'
> & {
  objResult: INewsCommentReportResult;
};

export type INewsCommentCreateResponse = IBaseResponse<INewsCommentDto>;
