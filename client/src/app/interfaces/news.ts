import { IPageInfo } from './common';

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
  ShareCount: number;
  LikeCount: number;
  AvgPoint: number;
  LstHashTagNews: IHashTagNews[];
  LstRefFileNews: IRefFileNews[];
}

export interface INewsResponse {
  Success: boolean;
  ErrorMessage: string;
  Data: any;
  DataList: any[];
  objResult: IPageInfo<INews>;
  RequestDTimeAt: Date;
  RequestClients: any;
}

//
export interface IDetailNewsResponse {
  Success: boolean;
  ErrorMessage: string;
  Data: IDetailNews;
  DataList: any;
  objResult: any;
  RequestDTimeAt: Date;
  RequestClients: any;
}
