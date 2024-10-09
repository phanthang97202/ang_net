export interface IChat {
  MessageId: string;
  UserId: string;
  Message: string;
  CreatedDTime: Date;
}

export interface IChatResponse {
  Success: boolean;
  ErrorMessage: string;
  Data: any;
  DataList: IChat[];
  RequestDTimeAt: Date;
  RequestClients: any[];
}
