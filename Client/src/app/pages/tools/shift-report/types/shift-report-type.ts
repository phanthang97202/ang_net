export interface ShiftReportTransaction {
  id?: number;
  orderNumber: number;
  roomNumber?: string;
  invoiceCode?: string;
  customerType?: string;
  cashAmount?: number;
  transferAmount?: number;
  prepaidNote?: string;
  expenseDescription?: string;
  expenseAmount?: number;
}

export interface ShiftReportRoomSale {
  id?: number;
  roomNumber: string;
  roomCategory: string;
  unitPrice: number;
}

export interface CreateShiftReportDto {
  shiftDate: string;
  shiftType: string;
  startTime: string;
  endTime: string;
  receptionistName: string;
  receiverName?: string;
  transactions: ShiftReportTransaction[];
  roomSales: ShiftReportRoomSale[];
}

export interface ShiftReportResponse {
  id: number;
  shiftDate: string;
  shiftType: string;
  startTime: string;
  endTime: string;
  receptionistName: string;
  totalCash: number;
  totalTransfer: number;
  totalExpense: number;
  handoverAmount: number;
  receiverName?: string;
  createdAt: string;
  updatedAt?: string;
  transactions: ShiftReportTransaction[];
  roomSales: ShiftReportRoomSale[];
}

export interface ShiftReportListItem {
  id: number;
  shiftDate: string;
  shiftType: string;
  receptionistName: string;
  totalCash: number;
  totalTransfer: number;
  handoverAmount: number;
  createdAt: string;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

export interface ShiftReportQueryParams {
  fromDate?: string;
  toDate?: string;
  receptionistName?: string;
  shiftType?: string;
  pageNumber?: number;
  pageSize?: number;
}
