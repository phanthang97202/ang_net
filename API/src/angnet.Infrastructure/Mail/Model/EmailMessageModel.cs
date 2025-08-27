using angnet.Utility.CommonUtils;

namespace angnet.Infrastructure.Mail.Service
{
    public class EmailMessageModel
    {
        public string Id { get; set; } = CommonUtils.GenUniqueId();
        public string To { get; set; } = string.Empty;  
        public string From { get; set; } = string.Empty;
        public string Subject { get; set; } = string.Empty;
        public string Body { get; set; } = string.Empty;
        public string FromHtml { get; set; } = string.Empty;
        public string ToHtml { get; set; } = string.Empty;
    }
}
