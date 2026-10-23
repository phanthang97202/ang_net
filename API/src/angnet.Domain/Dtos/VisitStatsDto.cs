namespace angnet.Domain.Dtos
{
    public class VisitStatsDto
    {
        public int OnlineCount { get; set; }
        public long MonthCount { get; set; }
        public long TotalCount { get; set; }
        public bool LegacyImported { get; set; }
        public bool LegacyMerged { get; set; }
    }
}
