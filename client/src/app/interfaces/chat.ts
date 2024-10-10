export interface IChat {
  MessageId: string;
  UserId: string;
  Message: string;
  CreatedDTime: Date;
}

export interface IPageInfo {
  PageIndex: number;
  PageSize: number;
  PageCount: number;
  ItemCount: number;
  DataList: IChat[];
}

export interface IChatResponse {
  Success: boolean;
  ErrorMessage: string;
  Data: any;
  DataList: any[];
  objResult: IPageInfo;
  RequestDTimeAt: Date;
  RequestClients: any;
}
