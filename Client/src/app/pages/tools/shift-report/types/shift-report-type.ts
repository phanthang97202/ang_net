interface BaseModel {
  FlagActive?: boolean;
  CreatedBy?: string;
  UpdatedBy?: string;
  CreatedDTime?: string | Date;
  UpdatedDTime?: string | Date;
}

export interface ShiftReportTransaction extends BaseModel {
  Id?: number;
  OrderNumber: number;
  RoomNumber?: string;
  InvoiceCode?: string;
  CustomerType?: string;
  CashAmount?: number;
  TransferAmount?: number;
  PrepaidNote?: string;
  ExpenseDescription?: string;
  ExpenseAmount?: number;
}

export interface ShiftReportRoomSale extends BaseModel {
  Id?: number;
  RoomNumber: string;
  RoomCategory: string;
  UnitPrice: number;
}

export interface CreateShiftReportDto extends BaseModel {
  ShiftDate: string;
  ShiftType: string;
  StartTime: string;
  EndTime: string;
  ReceptionistName: string;
  ReceiverName?: string;
  Transactions: ShiftReportTransaction[];
  RoomSales: ShiftReportRoomSale[];
}

export interface ShiftReportResponse {
  Id: number;
  ShiftDate: string;
  ShiftType: string;
  StartTime: string;
  EndTime: string;
  ReceptionistName: string;
  TotalCash: number;
  TotalTransfer: number;
  TotalExpense: number;
  HandoverAmount: number;
  ReceiverName?: string;
  CreatedAt: string;
  UpdatedAt?: string;
  Transactions: ShiftReportTransaction[];
  RoomSales: ShiftReportRoomSale[];
}

export interface ShiftReportListItem {
  Id: number;
  ShiftDate: string;
  ShiftType: string;
  ReceptionistName: string;
  TotalCash: number;
  TotalTransfer: number;
  HandoverAmount: number;
  CreatedAt: string;
}

export interface PagedResult<T> {
  Items: T[];
  TotalCount: number;
  PageNumber: number;
  PageSize: number;
  TotalPages: number;
  HasPrevious: boolean;
  HasNext: boolean;
}

export interface ShiftReportQueryParams {
  FromDate?: string;
  ToDate?: string;
  ReceptionistName?: string;
  ShiftType?: string;
  PageNumber?: number;
  PageSize?: number;
}
