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
}

interface IHashTagNews {
  HashTagNewsName: string;
}
interface IRefFileNews {
  FileUrl: string;
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
