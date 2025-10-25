export interface RevenueReportQueryParams {
  fromDate?: string;
  toDate?: string;
  receptionistName?: string;
  shiftType?: string;
  roomNumber?: string;
}

export interface RevenueReportSummary {
  TotalRevenue: number;
  TotalCash: number;
  TotalTransfer: number;
  TotalExpense: number;
  NetRevenue: number;
  TotalShifts: number;
  TotalTransactions: number;
}

export interface RevenueByDateDto {
  Date: string;
  TotalRevenue: number;
  TotalCash: number;
  TotalTransfer: number;
  TotalExpense: number;
  ShiftCount: number;
}

export interface RevenueByShiftTypeDto {
  ShiftType: string;
  TotalRevenue: number;
  TotalCash: number;
  TotalTransfer: number;
  ShiftCount: number;
}

export interface RevenueByReceptionistDto {
  ReceptionistName: string;
  TotalRevenue: number;
  TotalCash: number;
  TotalTransfer: number;
  ShiftCount: number;
}

export interface RevenueByRoomDto {
  RoomNumber: string;
  TotalRevenue: number;
  TotalCash: number;
  TotalTransfer: number;
  TransactionCount: number;
}

export interface ShiftReportListDto {
  Id: number;
  ShiftDate: string;
  ShiftType: string;
  ReceptionistName: string;
  TotalCash: number;
  TotalTransfer: number;
  HandoverAmount: number;
  CreatedDTime: string;
}

export interface RevenueReportResponse {
  Summary: RevenueReportSummary;
  RevenueByDate: RevenueByDateDto[];
  RevenueByShiftType: RevenueByShiftTypeDto[];
  RevenueByReceptionist: RevenueByReceptionistDto[];
  RevenueByRoom: RevenueByRoomDto[];
  Details: ShiftReportListDto[];
}
