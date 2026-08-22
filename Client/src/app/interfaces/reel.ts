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

// Không extend IBaseResponse<T>: objResult ở đây là cursor-based (ICursorPageInfo),
// khác hẳn IPageInfo offset-based mà IBaseResponse đang giả định.
export interface IReelFeedResponse {
  Success: boolean;
  ErrorMessage: string;
  Data: IReelDto;
  DataList: IReelDto[];
  objResult: ICursorPageInfo<IReelDto>;
  RequestDTimeAt: Date;
  /*ignore-ts*/
  RequestClients: any;
}
