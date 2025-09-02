using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace angnet.Domain.Models
{
    public class GenerationAuthCode : BaseModel
    {
        [Key]
        public string Id = Guid.NewGuid().ToString();
        public string Token { get; set; } = string.Empty;
        public string Salt { get; set; } = string.Empty;
        public int AttemptCount { get; set; }
        public string Type { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public DateTime ExpiredAt { get; set; }
        public bool IsUsed { get; set; } = true;
    }
}
