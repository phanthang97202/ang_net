namespace angnet.Domain.Dtos
{
    public class NoteDto
    {
        public string NoteId { get; set; } = string.Empty;
        public string Alias { get; set; } = string.Empty;
        public string ContentBody { get; set; } = string.Empty;
        public bool FlagActive { get; set; }
        public DateTime CreatedDTime { get; set; }
        public DateTime UpdatedDTime { get; set; }
    }

    public class NoteCreateDto
    {
        public string Alias { get; set; } = string.Empty;
        public string ContentBody { get; set; } = string.Empty;
    }

    public class NoteUnreadStateDto
    {
        public int UnreadCount { get; set; }
        public DateTime ServerDTime { get; set; }
    }
}
