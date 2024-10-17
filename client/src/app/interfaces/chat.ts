export type TypeMessage = 'string' | 'txt' | 'png' | 'jpg' | 'mp4' | 'mp3';
export interface IChat {
  MessageId: string;
  UserId: string;
  Message: string;
  Type: TypeMessage; //
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
