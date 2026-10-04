using angnet.Domain.Enums;

namespace angnet.Domain.Dtos
{
    public class ArchiveCollectionDto
    {
        public string CollectionId { get; set; } = string.Empty;
        public string OwnerId { get; set; } = string.Empty;
        public string OwnerFullName { get; set; } = string.Empty;
        public string OwnerAvatar { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        // Ảnh bìa hiển thị: ảnh tự chọn, không có thì thumbnail mục mới nhất
        public string CoverUrl { get; set; } = string.Empty;
        // Ảnh bìa chủ sở hữu tự chọn (rỗng = để tự động). Tách riêng để form sửa
        // không vô tình ghim ảnh bìa tự động thành ảnh cố định.
        public string CustomCoverUrl { get; set; } = string.Empty;
        public EArchiveVisibility Visibility { get; set; }
        public int SortOrder { get; set; }
        public int ItemCount { get; set; }
        public bool IsOwner { get; set; }
        public DateTime CreatedDTime { get; set; }
        public DateTime UpdatedDTime { get; set; }
    }

    public class ArchiveCollectionSaveDto
    {
        public string CollectionId { get; set; } = string.Empty; // Rỗng khi tạo mới
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string CoverUrl { get; set; } = string.Empty;
        public EArchiveVisibility Visibility { get; set; } = EArchiveVisibility.Private;
    }

    /// <summary>
    /// Dời một bộ sưu tập lên/xuống một bậc. Server tự tính số thứ tự mới,
    /// giống NewsCategoryReorderDto.
    /// </summary>
    public class ArchiveCollectionReorderDto
    {
        public string CollectionId { get; set; } = string.Empty;

        /// <summary>"up" hoặc "down".</summary>
        public string Direction { get; set; } = string.Empty;
    }

    public class ArchiveItemDto
    {
        public string ItemId { get; set; } = string.Empty;
        public string CollectionId { get; set; } = string.Empty;
        public EArchiveItemKind Kind { get; set; }
        public EArchiveProvider Provider { get; set; }
        public string SourceUrl { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Note { get; set; } = string.Empty;
        public string ThumbnailUrl { get; set; } = string.Empty;
        public int? Width { get; set; }
        public int? Height { get; set; }
        public int? DurationSeconds { get; set; }
        public long? Bytes { get; set; }
        public DateTime? TakenAt { get; set; }
        public DateTime CreatedDTime { get; set; }
    }

    public class ArchiveItemCreateDto
    {
        public string CollectionId { get; set; } = string.Empty;
        public EArchiveItemKind Kind { get; set; }
        public string SourceUrl { get; set; } = string.Empty;
        // Chỉ có với file tải lên; phải đúng public_id server đã cấp ở UploadSignature
        public string StoragePublicId { get; set; } = string.Empty;
        public string ThumbnailUrl { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Note { get; set; } = string.Empty;
        public int? Width { get; set; }
        public int? Height { get; set; }
        public int? DurationSeconds { get; set; }
        public long? Bytes { get; set; }
        public DateTime? TakenAt { get; set; }
    }

    public class ArchiveItemUpdateDto
    {
        public string ItemId { get; set; } = string.Empty;
        // Đổi sang bộ khác của chính mình = chuyển mục
        public string CollectionId { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Note { get; set; } = string.Empty;
        public string ThumbnailUrl { get; set; } = string.Empty;
        public DateTime? TakenAt { get; set; }
    }

    /// <summary>
    /// Chữ ký để trình duyệt tải file thẳng lên Cloudinary mà không lộ API secret.
    /// Chữ ký gắn chặt với PublicId do server sinh, nên một chữ ký chỉ tải được
    /// đúng một file vào đúng thư mục của người dùng.
    /// </summary>
    public class ArchiveUploadSignatureDto
    {
        public string UploadUrl { get; set; } = string.Empty;
        public string ApiKey { get; set; } = string.Empty;
        public long Timestamp { get; set; }
        public string Signature { get; set; } = string.Empty;
        public string PublicId { get; set; } = string.Empty;
        public string AssetFolder { get; set; } = string.Empty; // Rỗng nếu tài khoản dùng fixed folder
        public string AllowedFormats { get; set; } = string.Empty;
        public bool ReturnDeleteToken { get; set; } = true; // Đã nằm trong chữ ký, client phải gửi kèm
        public long MaxBytes { get; set; }
    }

    /// <summary>File trên Cloudinary cần xoá sau khi đã xoá bản ghi trong DB.</summary>
    public class ArchiveStoredFileDto
    {
        public string PublicId { get; set; } = string.Empty;
        public EArchiveItemKind Kind { get; set; }
    }
}
