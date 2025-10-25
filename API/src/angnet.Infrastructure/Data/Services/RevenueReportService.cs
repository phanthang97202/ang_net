using angnet.Domain.Dtos;
using Google;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace angnet.Infrastructure.Data.Services
{
    public interface IRevenueReportService
    {
        Task<RevenueReportResponse> GetRevenueReportAsync(RevenueReportQueryParams queryParams);
    }

    public class RevenueReportService : IRevenueReportService
    {
        private readonly AppDbContext _context;

        public RevenueReportService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<RevenueReportResponse> GetRevenueReportAsync(RevenueReportQueryParams queryParams)
        {
            // Build base query
            var query = _context.ShiftReport
                .Include(x => x.Transactions)
                .AsQueryable();

            // Apply filters
            if (queryParams.FromDate.HasValue)
                query = query.Where(x => x.ShiftDate >= queryParams.FromDate.Value);

            if (queryParams.ToDate.HasValue)
                query = query.Where(x => x.ShiftDate <= queryParams.ToDate.Value);

            if (!string.IsNullOrWhiteSpace(queryParams.ReceptionistName))
                query = query.Where(x => x.ReceptionistName.Contains(queryParams.ReceptionistName));

            if (!string.IsNullOrWhiteSpace(queryParams.ShiftType))
                query = query.Where(x => x.ShiftType == queryParams.ShiftType);

            if (!string.IsNullOrWhiteSpace(queryParams.RoomNumber))
                query = query.Where(x => x.Transactions.Any(t => t.RoomNumber == queryParams.RoomNumber && !string.IsNullOrWhiteSpace(t.InvoiceCode)));

            var shifts = await query.ToListAsync();

            // Filter transactions: Only include those with InvoiceCode
            var validTransactions = shifts
                .SelectMany(x => x.Transactions)
                .Where(t => !string.IsNullOrWhiteSpace(t.InvoiceCode))
                .ToList();

            // Calculate summary from valid transactions only
            var summary = new RevenueReportSummary
            {
                TotalCash = validTransactions.Sum(t => t.CashAmount ?? 0),
                TotalTransfer = validTransactions.Sum(t => t.TransferAmount ?? 0),
                TotalExpense = validTransactions.Sum(t => t.ExpenseAmount ?? 0),
                TotalShifts = shifts.Count,
                TotalTransactions = validTransactions.Count
            };
            summary.TotalRevenue = summary.TotalCash + summary.TotalTransfer;
            summary.NetRevenue = summary.TotalRevenue - summary.TotalExpense;

            // Revenue by date - only from valid transactions
            var revenueByDate = validTransactions
                .GroupBy(t => t.ShiftReport.ShiftDate)
                .Select(g => new RevenueByDateDto
                {
                    Date = g.Key,
                    TotalCash = g.Sum(t => t.CashAmount ?? 0),
                    TotalTransfer = g.Sum(t => t.TransferAmount ?? 0),
                    TotalExpense = g.Sum(t => t.ExpenseAmount ?? 0),
                    ShiftCount = g.Select(t => t.ShiftReportId).Distinct().Count()
                })
                .OrderBy(x => x.Date)
                .ToList();

            foreach (var item in revenueByDate)
            {
                item.TotalRevenue = item.TotalCash + item.TotalTransfer;
            }

            // Revenue by shift type - only from valid transactions
            var revenueByShiftType = validTransactions
                .GroupBy(t => t.ShiftReport.ShiftType)
                .Select(g => new RevenueByShiftTypeDto
                {
                    ShiftType = g.Key,
                    TotalCash = g.Sum(t => t.CashAmount ?? 0),
                    TotalTransfer = g.Sum(t => t.TransferAmount ?? 0),
                    ShiftCount = g.Select(t => t.ShiftReportId).Distinct().Count()
                })
                .ToList();

            foreach (var item in revenueByShiftType)
            {
                item.TotalRevenue = item.TotalCash + item.TotalTransfer;
            }

            // Revenue by receptionist - only from valid transactions
            var revenueByReceptionist = validTransactions
                .GroupBy(t => t.ShiftReport.ReceptionistName)
                .Select(g => new RevenueByReceptionistDto
                {
                    ReceptionistName = g.Key,
                    TotalCash = g.Sum(t => t.CashAmount ?? 0),
                    TotalTransfer = g.Sum(t => t.TransferAmount ?? 0),
                    ShiftCount = g.Select(t => t.ShiftReportId).Distinct().Count()
                })
                .OrderByDescending(x => x.TotalCash + x.TotalTransfer)
                .ToList();

            foreach (var item in revenueByReceptionist)
            {
                item.TotalRevenue = item.TotalCash + item.TotalTransfer;
            }

            // Revenue by room - only from valid transactions
            var revenueByRoom = validTransactions
                .Where(t => !string.IsNullOrWhiteSpace(t.RoomNumber))
                .GroupBy(t => t.RoomNumber)
                .Select(g => new RevenueByRoomDto
                {
                    RoomNumber = g.Key,
                    TotalCash = g.Sum(t => t.CashAmount ?? 0),
                    TotalTransfer = g.Sum(t => t.TransferAmount ?? 0),
                    TransactionCount = g.Count()
                })
                .OrderByDescending(x => x.TotalCash + x.TotalTransfer)
                .ToList();

            foreach (var item in revenueByRoom)
            {
                item.TotalRevenue = item.TotalCash + item.TotalTransfer;
            }

            // Details list - calculate totals from valid transactions only
            var shiftDetails = shifts.Select(shift => {
                var shiftValidTransactions = shift.Transactions
                    .Where(t => !string.IsNullOrWhiteSpace(t.InvoiceCode))
                    .ToList();

                return new ShiftReportListDto
                {
                    Id = shift.Id,
                    ShiftDate = shift.ShiftDate,
                    ShiftType = shift.ShiftType,
                    ReceptionistName = shift.ReceptionistName,
                    TotalCash = shiftValidTransactions.Sum(t => t.CashAmount ?? 0),
                    TotalTransfer = shiftValidTransactions.Sum(t => t.TransferAmount ?? 0),
                    HandoverAmount = shift.HandoverAmount,
                    CreatedDTime = shift.CreatedDTime
                };
            })
            .OrderByDescending(x => x.ShiftDate)
            .ToList();

            return new RevenueReportResponse
            {
                Summary = summary,
                RevenueByDate = revenueByDate,
                RevenueByShiftType = revenueByShiftType,
                RevenueByReceptionist = revenueByReceptionist,
                RevenueByRoom = revenueByRoom,
                Details = shiftDetails
            };
        }
    }
}
