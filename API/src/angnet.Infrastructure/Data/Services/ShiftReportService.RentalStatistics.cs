using angnet.Domain.Dtos;
using Microsoft.EntityFrameworkCore;
using TCommonUtils = angnet.Utility.CommonUtils.CommonUtils;

namespace angnet.Infrastructure.Data.Services;

public partial class ShiftReportService
{
    public async Task<ShiftRentalStatisticsDto> GetRentalStatisticsAsync(ShiftRentalStatisticsQuery query, CancellationToken ct = default)
    {
        if (query.FromDate is not { } from || query.ToDate is not { } to
            || to < from || to.DayNumber - from.DayNumber >= 93)
            throw new ArgumentException("Chọn đầy đủ khoảng ngày, tối đa 93 ngày và ngày kết thúc không trước ngày bắt đầu.");
        var receptionist = query.ReceptionistName?.Trim() ?? "";
        if (receptionist.Length > 100) throw new ArgumentException("Tên lễ tân tối đa 100 ký tự.");

        var inRange = _context.ShiftReport.AsNoTracking().Where(x => x.ShiftDate >= from && x.ShiftDate <= to);
        var reports = inRange;
        if (receptionist.Length != 0)
            reports = reports.Where(x => x.ReceptionistName.Trim() == receptionist);

        // A sale row represents one recorded rental, including a free rental or
        // a room sold more than once. Payment/check-out/drink rows are not arrivals.
        // The left join also retains reports with zero sales. Count distinct report
        // IDs so several room sales do not multiply the coverage count.
        var aggregates = await (
            from report in reports
            join sale in _context.ShiftReportRoomSale.AsNoTracking().Where(x => x.RoomNumber.Trim() != "")
                on report.Id equals sale.ShiftReportId into sales
            from sale in sales.DefaultIfEmpty()
            group new { report.Id, SaleId = (int?)sale.Id } by new { report.ShiftDate, ShiftType = report.ShiftType.Trim() } into rows
            select new
            {
                rows.Key.ShiftDate,
                rows.Key.ShiftType,
                Rentals = rows.Count(x => x.SaleId != null),
                Reports = rows.Select(x => x.Id).Distinct().Count()
            }).ToListAsync(ct);

        var days = Enumerable.Range(0, to.DayNumber - from.DayNumber + 1)
            .Select(offset => new ShiftRentalDayDto { Date = from.AddDays(offset) }).ToList();
        var byDate = days.ToDictionary(x => x.Date);
        foreach (var row in aggregates)
        {
            var day = byDate[row.ShiftDate];
            if (string.Equals(row.ShiftType, "Ca ngày", StringComparison.OrdinalIgnoreCase))
            { day.DayRentals += row.Rentals; day.DayReports += row.Reports; }
            else if (string.Equals(row.ShiftType, "Ca đêm", StringComparison.OrdinalIgnoreCase))
            { day.NightRentals += row.Rentals; day.NightReports += row.Reports; }
            else
            { day.OtherRentals += row.Rentals; day.OtherReports += row.Reports; }
        }
        // Coverage ignores the receptionist filter: a shift worked by someone else is not missing.
        var reportedShifts = await inRange.Select(x => new { x.ShiftDate, ShiftType = x.ShiftType.Trim() })
            .Distinct().ToListAsync(ct);
        foreach (var shift in reportedShifts)
        {
            if (string.Equals(shift.ShiftType, "Ca ngày", StringComparison.OrdinalIgnoreCase))
                byDate[shift.ShiftDate].DayShiftReported = true;
            else if (string.Equals(shift.ShiftType, "Ca đêm", StringComparison.OrdinalIgnoreCase))
                byDate[shift.ShiftDate].NightShiftReported = true;
        }
        // Today's shifts may still be in progress, so only earlier days count as incomplete.
        var today = DateOnly.FromDateTime(TCommonUtils.DTimeNow().AddHours(7));

        return new ShiftRentalStatisticsDto
        {
            FromDate = from, ToDate = to, ReceptionistName = receptionist,
            // Use stored names so historical receptionists remain selectable.
            Receptionists = await _context.ShiftReport.AsNoTracking()
                .Where(x => x.ReceptionistName.Trim() != "").Select(x => x.ReceptionistName.Trim())
                .Distinct().OrderBy(x => x).ToListAsync(ct),
            Days = days,
            Summary = new()
            {
                DayRentals = days.Sum(x => x.DayRentals), NightRentals = days.Sum(x => x.NightRentals),
                OtherRentals = days.Sum(x => x.OtherRentals),
                TotalRentals = days.Sum(x => x.DayRentals + x.NightRentals + x.OtherRentals),
                TotalReports = days.Sum(x => x.DayReports + x.NightReports + x.OtherReports),
                IncompleteDays = days.Count(x => x.Date < today && (!x.DayShiftReported || !x.NightShiftReported))
            }
        };
    }
}
