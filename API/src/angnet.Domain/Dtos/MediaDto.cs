namespace angnet.Domain.Dtos
{
    public class MediaAssetDto
    {
        public string AssetId { get; set; } = string.Empty;
        public string PublicId { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public string SecureUrl { get; set; } = string.Empty;
        public string ResourceType { get; set; } = string.Empty;
        public string Format { get; set; } = string.Empty;
        public string Folder { get; set; } = string.Empty;
        public long Bytes { get; set; }
        public int Width { get; set; }
        public int Height { get; set; }
        public double? Duration { get; set; }
        public DateTime? CreatedAt { get; set; }
    }

    public class MediaPageDto
    {
        public List<MediaAssetDto> Assets { get; set; } = [];
        public string NextCursor { get; set; } = string.Empty;
    }

    public class MediaFolderDto
    {
        public string ExternalId { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Path { get; set; } = string.Empty;
    }

    public class MediaFolderRequestDto
    {
        public string Path { get; set; } = string.Empty;
    }

    public class MediaUsageDto
    {
        public string Source { get; set; } = string.Empty;
        public string Id { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
    }

    public class MediaDeleteRequestDto
    {
        public string PublicId { get; set; } = string.Empty;
        public string SecureUrl { get; set; } = string.Empty;
        public string ResourceType { get; set; } = "image";
    }

    public class MediaDeleteResultDto
    {
        public bool Deleted { get; set; }
        public List<MediaUsageDto> Usages { get; set; } = [];
    }
}
