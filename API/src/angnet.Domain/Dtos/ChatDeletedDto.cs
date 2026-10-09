namespace angnet.Domain.Dtos;

public class ChatDeletedDto
{
    public string MessageId { get; set; } = string.Empty;
    public long Sequence { get; set; }
}
