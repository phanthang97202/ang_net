export interface AuthResponse {
  Success: boolean;
  ErrorMessage: any;
  RequestDTimeAt: Date;
  RequestClients: any;
  Data: {
    Token: string;
  };
  DataList: any;
  objResult: any;
}
