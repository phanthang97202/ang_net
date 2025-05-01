import { IBaseResponse } from './common';

export interface INewsCategory {
  NewsCategoryId: string;
  NewsCategoryParentId: string;
  NewsCategoryName: string;
  NewsCategoryIndex: number;
}

export interface INewsCategoryResponse extends IBaseResponse<INewsCategory> {
  DataList: INewsCategory[];
}

export interface INewsCategoryNode extends INewsCategory {
  key: string;
  title: string | undefined;
  children: any;
}
