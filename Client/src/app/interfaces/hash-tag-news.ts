import { IBaseResponse } from './common';

export interface IHashTagNews {
  HashTagNewsId: string;
  NewsId: string;
  HashTagNewsName: string;
  LanguageCode: 'vi' | 'en';
  FlagActive: boolean;
  CreatedDTime: Date;
  UpdatedDTime: Date;
}

export interface IHashTagNewsResponse extends IBaseResponse<IHashTagNews> {
  DataList: IHashTagNews[];
}
