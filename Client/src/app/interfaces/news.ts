import { IBaseResponse, IPageInfo } from './common';
export interface ICreateNews {
  Thumbnail: string;
  CategoryNewsId: string;
  ShortTitle: string;
  ShortTitleEn: string;
  ShortDescription: string;
  ShortDescriptionEn: string;
  ContentBody: string;
  ContentBodyEn: string;
  FlagActive: boolean;
  LstHashTagNews: IHashTagNews[];
  LstHashTagNewsEn: IHashTagNews[];
  LstRefFileNews: IRefFileNews[];
}
export interface INews {
  NewsId: string;
  UserId: string;
  CategoryNewsId: string;
  Slug: string;
  SlugEn: string;
  Thumbnail: string;
  ShortTitle: string;
  ShortTitleEn: string;
  ShortDescription: string;
  ShortDescriptionEn: string;
  ContentBody: string;
  ContentBodyEn: string;
  HasEnglishTranslation: boolean;
  CreatedDTime: Date;
  UpdatedDTime: Date;
  FlagActive: boolean;
  ViewCount: number;
  EstimatedReadingTime: number;
  EstimatedReadingTimeEn: number;
  ShareCount: number;
  LikeCount: number;
  IsLikedByMe: boolean;
  AvgPoint: number;
  TotalPoint: number;
  MyPoint: number;
  IsPinned: boolean;
  NotifiedAt: string | null;
  PinOrder: number;
}

interface IHashTagNews {
  HashTagNewsName: string;
}
export interface IRefFileNews {
  FileUrl: string;
}

// Tập trường tối thiểu để vẽ một dòng bài viết cỡ nhỏ (app-news-item-sm).
// IDetailNews thoả sẵn hình dạng này, nên khai báo riêng chỉ để những nguồn dữ
// liệu gọn hơn - như khối xem trước theo danh mục - cũng dùng lại được component
// đó mà không phải bịa ra các trường mình không có.
export interface INewsItemSm {
  NewsId: string;
  CategoryNewsId: string;
  Slug: string;
  SlugEn: string;
  Thumbnail: string;
  ShortTitle: string;
  ShortTitleEn: string;
  HasEnglishTranslation: boolean;
  CreatedDTime: string;
}

export interface IDetailNews {
  NewsId: string;
  UserId: string;
  UserName: string;
  FullName: string;
  Avatar: string;
  CategoryNewsId: string;
  CategoryNewsName: string;
  CategoryNewsNameEn: string;
  Slug: string;
  SlugEn: string;
  Thumbnail: string;
  ShortTitle: string;
  ShortTitleEn: string;
  ShortDescription: string;
  ShortDescriptionEn: string;
  ContentBody: string;
  ContentBodyEn: string;
  HasEnglishTranslation: boolean;
  CreatedDTime: string;
  UpdatedDTime: string;
  FlagActive: boolean;
  ViewCount: number;
  EstimatedReadingTime: number;
  EstimatedReadingTimeEn: number;
  ShareCount: number;
  LikeCount: number;
  IsLikedByMe: boolean;
  AvgPoint: number;
  TotalPoint: number;
  MyPoint: number;
  IsPinned: boolean;
  NotifiedAt: string | null;
  PinOrder: number;
  LstHashTagNews: IHashTagNews[];
  LstHashTagNewsEn: IHashTagNews[];
  LstRefFileNews: IRefFileNews[];
}

export interface INewsResponse extends IBaseResponse<IDetailNews> {
  objResult: IPageInfo<IDetailNews>;
}

//
export interface IDetailNewsResponse extends IBaseResponse<IDetailNews> {
  Data: IDetailNews;
}

export interface ILikeNewsResult {
  NewsId: string;
  Liked: boolean;
  LikeCount: number;
}

export type ILikeNewsResponse = Omit<
  IBaseResponse<IDetailNews>,
  'objResult'
> & {
  objResult: ILikeNewsResult;
};

export interface ISubscribeResult {
  Email: string;
  /** Email này đã đăng ký từ trước; client vẫn hiện cùng màn thành công */
  AlreadySubscribed: boolean;
}

export type ISubscribeResponse = Omit<
  IBaseResponse<ISubscribeResult>,
  'objResult'
> & {
  Data: ISubscribeResult;
};

export interface ISubscriberItem {
  SubscriberId: string;
  Email: string;
  /** false = người này đã huỷ đăng ký */
  FlagActive: boolean;
  CreatedDTime: string;
  UnsubscribedDTime: string | null;
}

export interface ISubscriberSearchResponse
  extends IBaseResponse<ISubscriberItem> {
  objResult: IPageInfo<ISubscriberItem>;
}

export type ISubscriberToggleActiveResponse = IBaseResponse<ISubscriberItem>;

export interface INotifyResult {
  NewsId: string;
  /** Số mail đã đẩy vào hàng đợi */
  SentCount: number;
  NotifiedAt: string;
}

export type INotifyResultResponse = Omit<
  IBaseResponse<INotifyResult>,
  'objResult'
> & {
  Data: INotifyResult;
};

export type TEmailDeliveryStatus = 'Pending' | 'Succeeded' | 'Failed' | 'Skipped';

export interface IEmailDeliverySummary {
  Total: number;
  Pending: number;
  Succeeded: number;
  Failed: number;
  /** Không gửi vì người nhận đã tắt trong lúc thư còn trong hàng đợi */
  Skipped: number;
}

export interface IEmailDeliveryItem {
  DeliveryId: string;
  NewsId: string;
  NewsTitle: string;
  Email: string;
  Status: TEmailDeliveryStatus;
  AttemptCount: number;
  LastError: string | null;
  QueuedAt: string;
  SentAt: string | null;
}

export interface IEmailDeliveryReport {
  Summary: IEmailDeliverySummary;
  Page: IPageInfo<IEmailDeliveryItem>;
}

export type IEmailDeliveryReportResponse = Omit<
  IBaseResponse<IEmailDeliveryReport>,
  'Data'
> & {
  Data: IEmailDeliveryReport;
};
