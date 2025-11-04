using angnet.Domain.Dtos;
using angnet.Domain.Models;
using TCommonUtils = angnet.Utility.CommonUtils.CommonUtils;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;

namespace angnet.Infrastructure.Data.Services
{
    public interface IShiftReportService
    {
        Task<ShiftReportResponseDto> CreateAsync(CreateShiftReportDto dto);
        Task<ShiftReportResponseDto> UpdateAsync(UpdateShiftReportDto dto);
        Task<bool> DeleteAsync(int id);
        Task<ShiftReportResponseDto> GetByIdAsync(int id);
        Task<PagedResult<ShiftReportListDto>> GetAllAsync(ShiftReportQueryParams queryParams);
    }

    public class ShiftReportService : IShiftReportService
    {
        private readonly AppDbContext _context;

        public ShiftReportService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<ShiftReportResponseDto> CreateAsync(CreateShiftReportDto dto)
        {
            var shiftReport = new ShiftReportModel
            {
                ShiftDate = dto.ShiftDate,
                ShiftType = dto.ShiftType,
                StartTime = dto.StartTime,
                EndTime = dto.EndTime,
                ReceptionistName = dto.ReceptionistName,
                ReceiverName = dto.ReceiverName,
                CreatedDTime = TCommonUtils.DTimeNow()
            };

            // Add transactions
            foreach (var txnDto in dto.Transactions)
            {
                shiftReport.Transactions.Add(new ShiftReportTransactionModel
                {
                    OrderNumber = txnDto.OrderNumber,
                    RoomNumber = txnDto.RoomNumber,
                    InvoiceCode = txnDto.InvoiceCode,
                    CustomerType = txnDto.CustomerType,
                    CashAmount = txnDto.CashAmount,
                    TransferAmount = txnDto.TransferAmount,
                    PrepaidNote = txnDto.PrepaidNote,
                    ExpenseDescription = txnDto.ExpenseDescription,
                    ExpenseAmount = txnDto.ExpenseAmount,
                    IsUseExpenseForReportRevenue = txnDto.IsUseExpenseForReportRevenue
                });
            }

            // Add room sales
            foreach (var saleDto in dto.RoomSales)
            {
                shiftReport.RoomSales.Add(new ShiftReportRoomSaleModel
                {
                    RoomNumber = saleDto.RoomNumber,
                    RoomCategory = saleDto.RoomCategory,
                    UnitPrice = saleDto.UnitPrice
                });
            }

            // Calculate totals
            CalculateTotals(shiftReport);

            _context.ShiftReport.Add(shiftReport);
            await _context.SaveChangesAsync();

            return await GetByIdAsync(shiftReport.Id);
        }

        public async Task<ShiftReportResponseDto> UpdateAsync(UpdateShiftReportDto dto)
        {
            var shiftReport = await _context.ShiftReport
                .Include(x => x.Transactions)
                .Include(x => x.RoomSales)
                .FirstOrDefaultAsync(x => x.Id == dto.Id);

            if (shiftReport == null)
                throw new KeyNotFoundException($"ShiftReport with ID {dto.Id} not found");

            var hoursDiff = (TCommonUtils.DTimeNow() - shiftReport.CreatedDTime).TotalHours;
            if (hoursDiff > 36)
            {
                throw new InvalidOperationException(
                    $"Không thể chỉnh sửa báo cáo ca đã được tạo hơn {Math.Floor(hoursDiff)} giờ trước."
                );
            }

            // Update basic info
            shiftReport.ShiftDate = dto.ShiftDate;
            shiftReport.ShiftType = dto.ShiftType;
            shiftReport.StartTime = dto.StartTime;
            shiftReport.EndTime = dto.EndTime;
            shiftReport.ReceptionistName = dto.ReceptionistName;
            shiftReport.ReceiverName = dto.ReceiverName;
            shiftReport.UpdatedDTime = TCommonUtils.DTimeNow();

            // Update transactions
            _context.ShiftReportTransaction.RemoveRange(shiftReport.Transactions);
            shiftReport.Transactions.Clear();

            foreach (var txnDto in dto.Transactions)
            {
                shiftReport.Transactions.Add(new ShiftReportTransactionModel
                {
                    OrderNumber = txnDto.OrderNumber,
                    RoomNumber = txnDto.RoomNumber,
                    InvoiceCode = txnDto.InvoiceCode,
                    CustomerType = txnDto.CustomerType,
                    CashAmount = txnDto.CashAmount,
                    TransferAmount = txnDto.TransferAmount,
                    PrepaidNote = txnDto.PrepaidNote,
                    ExpenseDescription = txnDto.ExpenseDescription,
                    ExpenseAmount = txnDto.ExpenseAmount,
                    IsUseExpenseForReportRevenue = txnDto.IsUseExpenseForReportRevenue
                });
            }

            // Update room sales
            _context.ShiftReportRoomSale.RemoveRange(shiftReport.RoomSales);
            shiftReport.RoomSales.Clear();

            foreach (var saleDto in dto.RoomSales)
            {
                shiftReport.RoomSales.Add(new ShiftReportRoomSaleModel
                {
                    RoomNumber = saleDto.RoomNumber,
                    RoomCategory = saleDto.RoomCategory,
                    UnitPrice = saleDto.UnitPrice
                });
            }

            // Recalculate totals
            CalculateTotals(shiftReport);

            await _context.SaveChangesAsync();

            return await GetByIdAsync(shiftReport.Id);
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var shiftReport = await _context.ShiftReport.FindAsync(id);
            if (shiftReport == null)
                return false;

            _context.ShiftReport.Remove(shiftReport);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<ShiftReportResponseDto> GetByIdAsync(int id)
        {
            var shiftReport = await _context.ShiftReport
                .Include(x => x.Transactions)
                .Include(x => x.RoomSales)
                .FirstOrDefaultAsync(x => x.Id == id);

            if (shiftReport == null)
                throw new KeyNotFoundException($"ShiftReport with ID {id} not found");

            return MapToResponseDto(shiftReport);
        }

        public async Task<PagedResult<ShiftReportListDto>> GetAllAsync(ShiftReportQueryParams queryParams)
        {
            var query = _context.ShiftReport.AsQueryable();

            // Apply filters
            if (queryParams.FromDate.HasValue)
                query = query.Where(x => x.ShiftDate >= queryParams.FromDate.Value);

            if (queryParams.ToDate.HasValue)
                query = query.Where(x => x.ShiftDate <= queryParams.ToDate.Value);

            if (!string.IsNullOrWhiteSpace(queryParams.ReceptionistName))
                query = query.Where(x => x.ReceptionistName.Contains(queryParams.ReceptionistName));

            if (!string.IsNullOrWhiteSpace(queryParams.ShiftType))
                query = query.Where(x => x.ShiftType == queryParams.ShiftType);

            var totalCount = await query.CountAsync();

            var items = await query
                .OrderByDescending(x => x.ShiftDate)
                .ThenByDescending(x => x.CreatedDTime)
                .Skip((queryParams.PageNumber - 1) * queryParams.PageSize)
                .Take(queryParams.PageSize)
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
                .ToListAsync();

            return new PagedResult<ShiftReportListDto>
            {
                Items = items,
                TotalCount = totalCount,
                PageNumber = queryParams.PageNumber,
                PageSize = queryParams.PageSize
            };
        }

        private void CalculateTotals(ShiftReportModel shiftReport)
        {
            shiftReport.TotalCash = shiftReport.Transactions
                .Where(x => x.CashAmount.HasValue)
                .Sum(x => x.CashAmount.Value);

            shiftReport.TotalTransfer = shiftReport.Transactions
                .Where(x => x.TransferAmount.HasValue)
                .Sum(x => x.TransferAmount.Value);

            shiftReport.TotalExpense = shiftReport.Transactions
                .Where(x => x.ExpenseAmount.HasValue)
                .Sum(x => x.ExpenseAmount.Value);

            shiftReport.HandoverAmount = shiftReport.TotalCash - shiftReport.TotalExpense;
        }

        private ShiftReportResponseDto MapToResponseDto(ShiftReportModel entity)
        {
            return new ShiftReportResponseDto
            {
                Id = entity.Id,
                ShiftDate = entity.ShiftDate,
                ShiftType = entity.ShiftType,
                StartTime = entity.StartTime,
                EndTime = entity.EndTime,
                ReceptionistName = entity.ReceptionistName,
                TotalCash = entity.TotalCash,
                TotalTransfer = entity.TotalTransfer,
                TotalExpense = entity.TotalExpense,
                HandoverAmount = entity.HandoverAmount,
                ReceiverName = entity.ReceiverName,
                CreatedAt = entity.CreatedDTime,
                UpdatedAt = entity.UpdatedDTime,
                Transactions = entity.Transactions.Select(t => new TransactionDto
                {
                    Id = t.Id,
                    OrderNumber = t.OrderNumber,
                    RoomNumber = t.RoomNumber,
                    InvoiceCode = t.InvoiceCode,
                    CustomerType = t.CustomerType,
                    CashAmount = t.CashAmount,
                    TransferAmount = t.TransferAmount,
                    PrepaidNote = t.PrepaidNote,
                    ExpenseDescription = t.ExpenseDescription,
                    ExpenseAmount = t.ExpenseAmount,
                    IsUseExpenseForReportRevenue = t.IsUseExpenseForReportRevenue
                }).ToList(),
                RoomSales = entity.RoomSales.Select(s => new RoomSaleDto
                {
                    Id = s.Id,
                    RoomNumber = s.RoomNumber,
                    RoomCategory = s.RoomCategory,
                    UnitPrice = s.UnitPrice
                }).ToList()
            };
        }
    }
}
