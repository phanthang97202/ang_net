export interface RevenueReportQueryParams {
  fromDate?: string;
  toDate?: string;
  receptionistName?: string;
  shiftType?: string;
  roomNumber?: string;
}

export interface RevenueReportSummary {
  totalRevenue: number;
  totalCash: number;
  totalTransfer: number;
  totalExpense: number;
  netRevenue: number;
  totalShifts: number;
  totalTransactions: number;
}

export interface RevenueByDateDto {
  date: string;
  totalRevenue: number;
  totalCash: number;
  totalTransfer: number;
  totalExpense: number;
  shiftCount: number;
}

export interface RevenueByShiftTypeDto {
  shiftType: string;
  totalRevenue: number;
  totalCash: number;
  totalTransfer: number;
  shiftCount: number;
}

export interface RevenueByReceptionistDto {
  receptionistName: string;
  totalRevenue: number;
  totalCash: number;
  totalTransfer: number;
  shiftCount: number;
}

export interface RevenueByRoomDto {
  roomNumber: string;
  totalRevenue: number;
  totalCash: number;
  totalTransfer: number;
  transactionCount: number;
}

export interface ShiftReportListDto {
  id: number;
  shiftDate: string;
  shiftType: string;
  receptionistName: string;
  totalCash: number;
  totalTransfer: number;
  handoverAmount: number;
  createdAt: string;
}

export interface RevenueReportResponse {
  summary: RevenueReportSummary;
  revenueByDate: RevenueByDateDto[];
  revenueByShiftType: RevenueByShiftTypeDto[];
  revenueByReceptionist: RevenueByReceptionistDto[];
  revenueByRoom: RevenueByRoomDto[];
  details: ShiftReportListDto[];
}
