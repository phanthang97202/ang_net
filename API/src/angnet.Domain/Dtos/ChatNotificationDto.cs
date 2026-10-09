using angnet.Domain.Models;
namespace angnet.Domain.Dtos;

public class ChatNotificationDto
{
    public int UnreadCount { get; set; }
    public ChatModel? LatestMessage { get; set; }
}
public class ChatReadDto
{
    public long Sequence { get; set; }
}
