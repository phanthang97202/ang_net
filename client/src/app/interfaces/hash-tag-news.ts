import { IPageInfo } from './common';

export interface IHashTagNews {
  HashTagNewsId: string;
  NewsId: string;
  HashTagNewsName: string;
  FlagActive: boolean;
  CreatedDTime: Date;
  UpdatedDTime: Date;
}

export interface IHashTagNewsResponse {
  Success: boolean;
  ErrorMessage: string;
  Data: any;
  DataList: IHashTagNews[];
  objResult: any;
  RequestDTimeAt: Date;
  RequestClients: any;
}
