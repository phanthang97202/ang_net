import { IBaseResponse, IPageInfo } from './common';

export interface IHashTagNews {
  HashTagNewsId: string;
  NewsId: string;
  HashTagNewsName: string;
  FlagActive: boolean;
  CreatedDTime: Date;
  UpdatedDTime: Date;
}

export interface IHashTagNewsResponse extends IBaseResponse<IHashTagNews> {
  DataList: IHashTagNews[];
}
