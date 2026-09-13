import { IBaseResponse, IPageInfo } from './common';
export interface ICreateNews {
  Thumbnail: string;
  CategoryNewsId: string;
  ShortTitle: string;
  ShortDescription: string;
  ContentBody: string;
  FlagActive: boolean;
  LstHashTagNews: IHashTagNews[];
  LstRefFileNews: IRefFileNews[];
}
export interface INews {
  NewsId: string;
  UserId: string;
  CategoryNewsId: string;
  Slug: string;
  Thumbnail: string;
  ShortTitle: string;
  ShortDescription: string;
  ContentBody: string;
  CreatedDTime: Date;
  UpdatedDTime: Date;
  FlagActive: boolean;
  ViewCount: number;
  EstimatedReadingTime: number;
  ShareCount: number;
  LikeCount: number;
  AvgPoint: number;
  TotalPoint: number;
  MyPoint: number;
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
  Thumbnail: string;
  ShortTitle: string;
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
  Slug: string;
  Thumbnail: string;
  ShortTitle: string;
  ShortDescription: string;
  ContentBody: string;
  CreatedDTime: string;
  UpdatedDTime: string;
  FlagActive: boolean;
  ViewCount: number;
  EstimatedReadingTime: number;
  ShareCount: number;
  LikeCount: number;
  AvgPoint: number;
  TotalPoint: number;
  MyPoint: number;
  LstHashTagNews: IHashTagNews[];
  LstRefFileNews: IRefFileNews[];
}

export interface INewsResponse extends IBaseResponse<IDetailNews> {
  objResult: IPageInfo<IDetailNews>;
}

//
export interface IDetailNewsResponse extends IBaseResponse<IDetailNews> {
  Data: IDetailNews;
}
