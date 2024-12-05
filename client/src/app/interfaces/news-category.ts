import { IBaseResponse, IPageInfo } from './common';

export interface INewsCategory {
  NewsCategoryId: string;
  NewsCategoryParentId: string;
  NewsCategoryName: string;
  NewsCategoryIndex: number;
}

export interface INewsCategoryResponse extends IBaseResponse<INewsCategory> {
  DataList: INewsCategory[];
}
