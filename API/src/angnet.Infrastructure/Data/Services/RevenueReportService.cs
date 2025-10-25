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
                query = query.Where(x => x.Transactions.Any(t => t.RoomNumber == queryParams.RoomNumber));

            var shifts = await query.ToListAsync();

            // Calculate summary
            var summary = new RevenueReportSummary
            {
                TotalCash = shifts.Sum(x => x.TotalCash),
                TotalTransfer = shifts.Sum(x => x.TotalTransfer),
                TotalExpense = shifts.Sum(x => x.TotalExpense),
                TotalShifts = shifts.Count,
                TotalTransactions = shifts.Sum(x => x.Transactions.Count)
            };
            summary.TotalRevenue = summary.TotalCash + summary.TotalTransfer;
            summary.NetRevenue = summary.TotalRevenue - summary.TotalExpense;

            // Revenue by date
            var revenueByDate = shifts
                .GroupBy(x => x.ShiftDate)
                .Select(g => new RevenueByDateDto
                {
                    Date = g.Key,
                    TotalCash = g.Sum(x => x.TotalCash),
                    TotalTransfer = g.Sum(x => x.TotalTransfer),
                    TotalExpense = g.Sum(x => x.TotalExpense),
                    ShiftCount = g.Count()
                })
                .OrderBy(x => x.Date)
                .ToList();

            foreach (var item in revenueByDate)
            {
                item.TotalRevenue = item.TotalCash + item.TotalTransfer;
            }

            // Revenue by shift type
            var revenueByShiftType = shifts
                .GroupBy(x => x.ShiftType)
                .Select(g => new RevenueByShiftTypeDto
                {
                    ShiftType = g.Key,
                    TotalCash = g.Sum(x => x.TotalCash),
                    TotalTransfer = g.Sum(x => x.TotalTransfer),
                    ShiftCount = g.Count()
                })
                .ToList();

            foreach (var item in revenueByShiftType)
            {
                item.TotalRevenue = item.TotalCash + item.TotalTransfer;
            }

            // Revenue by receptionist
            var revenueByReceptionist = shifts
                .GroupBy(x => x.ReceptionistName)
                .Select(g => new RevenueByReceptionistDto
                {
                    ReceptionistName = g.Key,
                    TotalCash = g.Sum(x => x.TotalCash),
                    TotalTransfer = g.Sum(x => x.TotalTransfer),
                    ShiftCount = g.Count()
                })
                .OrderByDescending(x => x.TotalCash + x.TotalTransfer)
                .ToList();

            foreach (var item in revenueByReceptionist)
            {
                item.TotalRevenue = item.TotalCash + item.TotalTransfer;
            }

            // Revenue by room
            var transactions = shifts.SelectMany(x => x.Transactions).ToList();
            var revenueByRoom = transactions
                .Where(x => !string.IsNullOrWhiteSpace(x.RoomNumber))
                .GroupBy(x => x.RoomNumber)
                .Select(g => new RevenueByRoomDto
                {
                    RoomNumber = g.Key,
                    TotalCash = g.Sum(x => x.CashAmount ?? 0),
                    TotalTransfer = g.Sum(x => x.TransferAmount ?? 0),
                    TransactionCount = g.Count()
                })
                .OrderByDescending(x => x.TotalCash + x.TotalTransfer)
                .ToList();

            foreach (var item in revenueByRoom)
            {
                item.TotalRevenue = item.TotalCash + item.TotalTransfer;
            }

            // Details list
            var details = shifts
                .OrderByDescending(x => x.ShiftDate)
                .Select(x => new ShiftReportListDto
                {
                    Id = x.Id,
                    ShiftDate = x.ShiftDate,
                    ShiftType = x.ShiftType,
                    ReceptionistName = x.ReceptionistName,
                    TotalCash = x.TotalCash,
                    TotalTransfer = x.TotalTransfer,
                    HandoverAmount = x.HandoverAmount,
                    CreatedDTime = x.CreatedDTime
                })
                .ToList();

            return new RevenueReportResponse
            {
                Summary = summary,
                RevenueByDate = revenueByDate,
                RevenueByShiftType = revenueByShiftType,
                RevenueByReceptionist = revenueByReceptionist,
                RevenueByRoom = revenueByRoom,
                Details = details
            };
        }
    }
}
