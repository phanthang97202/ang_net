import { IBaseResponse, IPageInfo } from './common';

export interface ISearchSysParameterRequest {
  pageIndex: number;
  pageSize: number;
  keyword: string;
  category: string;
}

export interface ISysParameter {
  ParameterCode: string;
  ParameterNameVi: string;
  ParameterNameEn: string;
  ParameterValueVi: string;
  ParameterValueEn: string;
  DefaultValueVi: string;
  DefaultValueEn: string;
  DataType: string;
  Category: string;
  DescriptionVi: string;
  DescriptionEn: string;
  SortOrder: number;
  FlagActive: boolean;
  CreatedDTime: Date;
  UpdatedDTime: Date;
}

export interface IResponseSysParameterSearch
  extends IBaseResponse<ISysParameter> {
  objResult: IPageInfo<ISysParameter>;
}

export interface IRequestSysParameterCreate
  extends Omit<ISysParameter, 'CreatedDTime' | 'UpdatedDTime'> {}

export interface IResponseSysParameterCreate
  extends IBaseResponse<ISysParameter> {}
