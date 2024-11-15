import { IPageInfo } from './common';

export interface INewsCategory {
  NewsCategoryId: string;
  NewsCategoryParentId: string;
  NewsCategoryName: string;
  NewsCategoryIndex: number;
}

export interface INewsCategoryResponse {
  Success: boolean;
  ErrorMessage: string;
  Data: any;
  DataList: INewsCategory[];
  objResult: any;
  RequestDTimeAt: Date;
  RequestClients: any;
}
