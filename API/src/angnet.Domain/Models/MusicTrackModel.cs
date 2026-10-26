using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using angnet.Domain.Enums;

namespace angnet.Domain.Models
{
    /// <summary>
    /// Danh mục bài hát dùng chung cho mọi người dùng: 1 bài của 1 nguồn = 1 dòng,
    /// dù bao nhiêu người lưu. Chỉ là bản chụp metadata, không lưu file hay stream
    /// URL (URL stream được dựng lại từ ExternalId lúc phát).
    /// </summary>
    public class MusicTrackModel : BaseModel
    {
        [Key]
        [Required]
        public string TrackId { get; set; } = Guid.NewGuid().ToString(); // Mã nội bộ, các bảng khác chỉ tham chiếu cột này

        [Column(TypeName = "varchar(30)")]
        public EMusicProvider Provider { get; set; } // Nguồn phát

        [Required]
        public string ExternalId { get; set; } = string.Empty; // Mã bài bên nguồn (videoId YouTube, track id Audius...)

        public string Title { get; set; } = string.Empty; // Lấy từ nguồn, không tin client
        public string Artist { get; set; } = string.Empty;
        public string ThumbnailUrl { get; set; } = string.Empty;
        public int? DurationSeconds { get; set; } // YouTube oEmbed không trả thời lượng nên có thể rỗng
        public string ExternalUrl { get; set; } = string.Empty; // Link gốc, server tự dựng từ Provider + ExternalId

        [Column(TypeName = "jsonb")]
        public string Metadata { get; set; } = "{}"; // Trường riêng của từng nguồn, không phải thêm cột

        [Column(TypeName = "varchar(20)")]
        public EMusicTrackAvailability Availability { get; set; } = EMusicTrackAvailability.Available;
    }
}
