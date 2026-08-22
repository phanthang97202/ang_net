using angnet.Domain.Enums;

namespace angnet.Domain.Dtos
{
    public class ReelCreateDto
    {
        public string Caption { get; set; } = string.Empty;
        public EReelMediaType MediaType { get; set; }
        public string CoverUrl { get; set; } = string.Empty;
        public List<ReelMediaCreateDto> Media { get; set; } = new List<ReelMediaCreateDto>();
    }

    public class ReelMediaCreateDto
    {
        public string MediaUrl { get; set; } = string.Empty;
        public int SortOrder { get; set; }
        public int? DurationSeconds { get; set; }
        public int? Width { get; set; }
        public int? Height { get; set; }
    }
}
