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
        Task<List<DrinkStockDto>> GetDrinkStockAsync();
    }

    public class ShiftReportService : IShiftReportService
    {
        private readonly AppDbContext _context;

        public ShiftReportService(AppDbContext context)
        {
            _context = context;
        }

        // Mã tham số hệ thống khai báo danh mục nước + số lượng NHẬP kho.
        private const string DRINK_STOCK_PARAM = "SHIFT_DRINK_STOCK";

        // Cấu hình 1 sản phẩm đọc từ JSON của tham số hệ thống.
        private class DrinkStockConfig
        {
            public string code { get; set; } = string.Empty;
            public string name { get; set; } = string.Empty;
            public string unit { get; set; } = string.Empty;
            public decimal price { get; set; }
            public int stockIn { get; set; }
        }

        private async Task<List<DrinkStockConfig>> LoadDrinkConfigAsync()
        {
            var param = await _context.SysParameter
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.ParameterCode == DRINK_STOCK_PARAM);

            var raw = param?.ParameterValueVi;
            if (string.IsNullOrWhiteSpace(raw))
                return new List<DrinkStockConfig>();

            try
            {
                var list = System.Text.Json.JsonSerializer.Deserialize<List<DrinkStockConfig>>(
                    raw,
                    new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                return list ?? new List<DrinkStockConfig>();
            }
            catch
            {
                // Tham số cấu hình sai định dạng thì coi như chưa khai báo sản phẩm
                // nào - validate bên dưới sẽ chặn mọi giao dịch bán nước.
                return new List<DrinkStockConfig>();
            }
        }

        // Tồn còn lại = stockIn (tham số) - tổng đã bán trên toàn bộ lịch sử.
        // excludeShiftReportId dùng khi SỬA báo cáo: phần đã bán của chính báo cáo
        // đó phải được loại ra, nếu không sửa 5 -> 6 lon sẽ bị chặn oan.
        private async Task<Dictionary<string, int>> GetSoldQuantityAsync(int? excludeShiftReportId = null)
        {
            var query = _context.ShiftReportDrinkSale.AsNoTracking();
            if (excludeShiftReportId.HasValue)
                query = query.Where(x => x.ShiftReportId != excludeShiftReportId.Value);

            var sold = await query
                .GroupBy(x => x.ProductCode)
                .Select(g => new { ProductCode = g.Key, Total = g.Sum(x => x.Quantity) })
                .ToListAsync();

            return sold.ToDictionary(x => x.ProductCode, x => x.Total);
        }

        public async Task<List<DrinkStockDto>> GetDrinkStockAsync()
        {
            var config = await LoadDrinkConfigAsync();
            var sold = await GetSoldQuantityAsync();

            return config.Select(c =>
            {
                var soldQty = sold.TryGetValue(c.code, out var q) ? q : 0;
                return new DrinkStockDto
                {
                    ProductCode = c.code,
                    ProductName = c.name,
                    Unit = c.unit,
                    UnitPrice = c.price,
                    StockIn = c.stockIn,
                    SoldQuantity = soldQty,
                    Remaining = c.stockIn - soldQty
                };
            }).ToList();
        }

        // Chặn bán vượt tồn. Đặt ở service chứ không chỉ ở giao diện: chặn phía
        // client thì gọi thẳng API vẫn lọt.
        private async Task ValidateDrinkStockAsync(List<DrinkSaleDto> drinkSales, int? excludeShiftReportId)
        {
            if (drinkSales == null || drinkSales.Count == 0)
                return;

            var config = await LoadDrinkConfigAsync();
            var sold = await GetSoldQuantityAsync(excludeShiftReportId);

            // Gộp theo sản phẩm: cùng 1 loại nước có thể được nhập thành nhiều dòng.
            var requested = drinkSales
                .GroupBy(x => x.ProductCode)
                .Select(g => new { ProductCode = g.Key, Total = g.Sum(x => x.Quantity) });

            foreach (var item in requested)
            {
                var product = config.FirstOrDefault(c => c.code == item.ProductCode);
                if (product == null)
                    throw new InvalidOperationException(
                        $"Sản phẩm '{item.ProductCode}' không có trong danh mục kho.");

                if (item.Total <= 0)
                    throw new InvalidOperationException(
                        $"Số lượng bán của '{product.name}' phải lớn hơn 0.");

                var soldQty = sold.TryGetValue(item.ProductCode, out var q) ? q : 0;
                var remaining = product.stockIn - soldQty;

                if (item.Total > remaining)
                    throw new InvalidOperationException(
                        $"'{product.name}' chỉ còn {remaining} {product.unit} trong kho, không đủ để bán {item.Total} {product.unit}.");
            }
        }

        public async Task<ShiftReportResponseDto> CreateAsync(CreateShiftReportDto dto)
        {
            await ValidateDrinkStockAsync(dto.DrinkSales, null);

            var shiftReport = new ShiftReportModel
            {
                ShiftDate = dto.ShiftDate,
                ShiftType = dto.ShiftType,
                StartTime = dto.StartTime,
                EndTime = dto.EndTime,
                ReceptionistName = dto.ReceptionistName,
                ReceiverName = dto.ReceiverName,
                CreatedBy = dto.ReceptionistName, // sau này sửa thành người đăng nhập
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
                    IsUseExpenseForReportRevenue = txnDto.IsUseExpenseForReportRevenue,
                    CreatedBy = shiftReport.ReceptionistName, // sau này sửa thành người đăng nhập
                    CreatedDTime = TCommonUtils.DTimeNow()
                });
            }

            // Add room sales
            foreach (var saleDto in dto.RoomSales)
            {
                shiftReport.RoomSales.Add(new ShiftReportRoomSaleModel
                {
                    RoomNumber = saleDto.RoomNumber,
                    RoomCategory = saleDto.RoomCategory,
                    UnitPrice = saleDto.UnitPrice,
                    CreatedBy = shiftReport.ReceptionistName, // sau này sửa thành người đăng nhập
                    CreatedDTime = TCommonUtils.DTimeNow()
                });
            }

            // Add drink sales
            foreach (var drinkDto in dto.DrinkSales)
            {
                shiftReport.DrinkSales.Add(new ShiftReportDrinkSaleModel
                {
                    ProductCode = drinkDto.ProductCode,
                    ProductName = drinkDto.ProductName,
                    Unit = drinkDto.Unit,
                    Quantity = drinkDto.Quantity,
                    UnitPrice = drinkDto.UnitPrice,
                    PaymentMethod = drinkDto.PaymentMethod,
                    CreatedBy = shiftReport.ReceptionistName, // sau này sửa thành người đăng nhập
                    CreatedDTime = TCommonUtils.DTimeNow()
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
            // Loại phần đã bán của chính báo cáo này ra khỏi phép tính tồn, nếu
            // không thì sửa tăng số lượng sẽ bị chặn oan.
            await ValidateDrinkStockAsync(dto.DrinkSales, dto.Id);

            var shiftReport = await _context.ShiftReport
                .Include(x => x.Transactions)
                .Include(x => x.RoomSales)
                .Include(x => x.DrinkSales)
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
            shiftReport.UpdatedBy = dto.ReceptionistName; // sau này sửa thành người đăng nhập
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
                    IsUseExpenseForReportRevenue = txnDto.IsUseExpenseForReportRevenue,
                    UpdatedBy = shiftReport.ReceptionistName, // sau này sửa thành người đăng nhập
                    UpdatedDTime = TCommonUtils.DTimeNow()
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
                    UnitPrice = saleDto.UnitPrice,
                    UpdatedBy = shiftReport.ReceptionistName, // sau này sửa thành người đăng nhập
                    UpdatedDTime = TCommonUtils.DTimeNow()
                });
            }

            // Update drink sales
            _context.ShiftReportDrinkSale.RemoveRange(shiftReport.DrinkSales);
            shiftReport.DrinkSales.Clear();

            foreach (var drinkDto in dto.DrinkSales)
            {
                shiftReport.DrinkSales.Add(new ShiftReportDrinkSaleModel
                {
                    ProductCode = drinkDto.ProductCode,
                    ProductName = drinkDto.ProductName,
                    Unit = drinkDto.Unit,
                    Quantity = drinkDto.Quantity,
                    UnitPrice = drinkDto.UnitPrice,
                    PaymentMethod = drinkDto.PaymentMethod,
                    UpdatedBy = shiftReport.ReceptionistName, // sau này sửa thành người đăng nhập
                    UpdatedDTime = TCommonUtils.DTimeNow()
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
                .Include(x => x.DrinkSales)
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
            // Tiền bán nước cộng thẳng vào tiền ca theo hình thức thanh toán của
            // từng dòng. Phần tiền mặt vì thế tự chảy vào HandoverAmount qua công
            // thức sẵn có bên dưới, không phải sửa gì thêm.
            var drinkCash = shiftReport.DrinkSales
                .Where(x => x.PaymentMethod == "Tiền mặt")
                .Sum(x => x.Quantity * x.UnitPrice);

            var drinkTransfer = shiftReport.DrinkSales
                .Where(x => x.PaymentMethod == "Chuyển khoản")
                .Sum(x => x.Quantity * x.UnitPrice);

            shiftReport.TotalCash = shiftReport.Transactions
                .Where(x => x.CashAmount.HasValue)
                .Sum(x => x.CashAmount.Value) + drinkCash;

            shiftReport.TotalTransfer = shiftReport.Transactions
                .Where(x => x.TransferAmount.HasValue)
                .Sum(x => x.TransferAmount.Value) + drinkTransfer;

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
                }).ToList(),
                DrinkSales = entity.DrinkSales.Select(d => new DrinkSaleDto
                {
                    Id = d.Id,
                    ProductCode = d.ProductCode,
                    ProductName = d.ProductName,
                    Unit = d.Unit,
                    Quantity = d.Quantity,
                    UnitPrice = d.UnitPrice,
                    PaymentMethod = d.PaymentMethod
                }).ToList()
            };
        }
    }
}
