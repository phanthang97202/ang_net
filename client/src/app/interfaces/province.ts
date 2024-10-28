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

export interface IResponseProvinceSearch<T> {
  Success: boolean;
  ErrorMessage: string | null;
  RequestDTimeAt: Date;
  RequestClients: any | null;
  Data: T;
  DataList: T[];
  objResult: {
    PageIndex: number;
    PageSize: number;
    PageCount: number;
    ItemCount: number;
    DataList: T[];
  };
}
