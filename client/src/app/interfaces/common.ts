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

export interface IButtonBreadcrumb {
  text: string;
  nzType: 'primary' | 'default' | 'dashed' | 'text' | 'link';
  nzShape: 'circle' | 'round' | 'default';
  nzSize: 'large' | 'small' | 'default';
  disabled: boolean;
  iconType: string;
  iconTheme: 'fill' | 'outline' | 'twotone';
  onClick: () => void;
}
