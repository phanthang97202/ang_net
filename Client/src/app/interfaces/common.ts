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
  /*ignore-ts*/
  RequestClients: any;
}

export interface IButtonCommon {
  class?: string;
  text?: string;
  nzType?: 'primary' | 'default' | 'dashed' | 'text' | 'link';
  nzShape?: 'circle' | 'round';
  nzSize?: 'large' | 'small' | 'default';
  disabled?: boolean;
  iconType: string;
  iconTheme?: 'fill' | 'outline' | 'twotone';
  onClick: (event: MouseEvent) => void;
  nzBlock?: boolean;
  nzDanger?: boolean;
  nzLoading?: boolean;
  nzGhost?: boolean;
}
export interface IIconCommon {
  class?: string;
  iconType: string;
  iconTheme?: 'fill' | 'outline' | 'twotone';
  iconSpin?: boolean;
  iconTwotoneColor?: string;
  iconIconfont?: string;
  iconRotate?: number;
}

export interface IButtonBreadcrumb extends IButtonCommon {
  classContainer?: string;
}
