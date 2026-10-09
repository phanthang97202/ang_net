using System.ComponentModel.DataAnnotations;

namespace angnet.Domain.Models;

public class ChatReadState
{
    [Key] public string UserId { get; set; } = "";
    public long LastReadSequence { get; set; }
}
