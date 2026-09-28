namespace angnet.Domain.Dtos
{
    public class CacheClearResultDto
    {
        public long DeletedKeyCount { get; set; }
        public DateTime ClearedAtUtc { get; set; }
    }
}
