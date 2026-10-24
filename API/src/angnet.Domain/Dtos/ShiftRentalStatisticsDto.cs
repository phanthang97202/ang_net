using System.ComponentModel.DataAnnotations;

namespace angnet.Domain.Dtos;

public class ShiftRentalStatisticsQuery
{
    [Required] public DateOnly? FromDate { get; set; }
    [Required] public DateOnly? ToDate { get; set; }
    [MaxLength(100)] public string? ReceptionistName { get; set; }
}

public class ShiftRentalDayDto
{
    public DateOnly Date { get; set; }
    public int DayRentals { get; set; }
    public int NightRentals { get; set; }
    public int OtherRentals { get; set; }
    public int DayReports { get; set; }
    public int NightReports { get; set; }
    public int OtherReports { get; set; }
    // Whether any receptionist reported the shift, independent of the receptionist filter.
    public bool DayShiftReported { get; set; }
    public bool NightShiftReported { get; set; }
}

public class ShiftRentalSummaryDto
{
    public int TotalRentals { get; set; }
    public int DayRentals { get; set; }
    public int NightRentals { get; set; }
    public int OtherRentals { get; set; }
    public int TotalReports { get; set; }
    public int IncompleteDays { get; set; }
}

public class ShiftRentalStatisticsDto
{
    public DateOnly FromDate { get; set; }
    public DateOnly ToDate { get; set; }
    public string ReceptionistName { get; set; } = "";
    public List<string> Receptionists { get; set; } = [];
    public ShiftRentalSummaryDto Summary { get; set; } = new();
    public List<ShiftRentalDayDto> Days { get; set; } = [];
}
