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
  IsUseExpenseForReportRevenue: boolean;
}

export interface ShiftReportRoomSale extends BaseModel {
  Id?: number;
  RoomNumber: string;
  RoomCategory: string;
  UnitPrice: number;
}

export interface ShiftReportDrinkSale extends BaseModel {
  Id?: number;
  ProductCode: string;
  ProductName: string;
  Unit: string;
  Quantity: number;
  UnitPrice: number;
  PaymentMethod: string; // 'Tiền mặt' | 'Chuyển khoản'
}

// Tồn kho 1 sản phẩm nước: StockIn khai trong tham số hệ thống
// SHIFT_DRINK_STOCK, SoldQuantity là tổng đã bán trên toàn bộ lịch sử.
export interface DrinkStock {
  ProductCode: string;
  ProductName: string;
  Unit: string;
  UnitPrice: number;
  StockIn: number;
  SoldQuantity: number;
  Remaining: number;
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
  DrinkSales: ShiftReportDrinkSale[];
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
  DrinkSales: ShiftReportDrinkSale[];
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
  fromDate?: string;
  toDate?: string;
  receptionistName?: string;
  shiftType?: string;
  pageNumber?: number;
  pageSize?: number;
}

// Bảng giá phòng, cấu hình qua tham số hệ thống SHIFT_ROOM_PRICES. Mỗi phòng
// thuộc 1 loại phòng và có 3 mức giá theo loại khách (ngày / đêm / giờ) - dùng
// để tự điền đơn giá khi nhập số phòng/loại khách ở bảng "Bán phòng ngày".
export interface ShiftRoomPrice {
  roomNumber: string;
  roomType?: string;
  dayPrice?: number;
  nightPrice?: number;
  hourPrice?: number;
}
