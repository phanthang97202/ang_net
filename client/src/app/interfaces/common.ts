export interface IPageInfo<T> {
  PageIndex: number;
  PageSize: number;
  PageCount: number;
  ItemCount: number;
  DataList: T[];
}

export interface IBaseResponse<T> {
  Success: boolean;
  ErrorMessage: string;
  Data: T;
  DataList: T[];
  objResult: IPageInfo<T>;
  RequestDTimeAt: Date;
  RequestClients: any;
}
