import { IBaseResponse, IPageInfo } from './common';

export interface ISearchProvinceRequest {
  pageIndex: number;
  pageSize: number;
  keyword: string;
}

export interface IProvince {
  ProvinceCode: string;
  ProvinceName: string;
  FlagActive: boolean;
  CreatedDTime: Date;
  UpdatedDTime: Date;
}

export interface IResponseProvinceSearch extends IBaseResponse<IProvince> {
  objResult: IPageInfo<IProvince>;
}
