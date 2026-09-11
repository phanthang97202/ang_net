using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace angnet.Domain.Models
{
    public class ShiftReportDrinkSaleModel : BaseModel
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int ShiftReportId { get; set; }

        // Khoá bất biến đối chiếu với tham số SHIFT_DRINK_STOCK. Tên và giá bên
        // dưới là bản chụp lúc bán, nên đổi tên/giá trong tham số về sau không
        // làm sai lệch báo cáo cũ.
        [Required]
        [MaxLength(50)]
        public string ProductCode { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string ProductName { get; set; } = string.Empty;

        [Required]
        [MaxLength(20)]
        public string Unit { get; set; } = string.Empty; // "lon", "chai"

        [Required]
        public int Quantity { get; set; }

        [Required]
        [Precision(18, 2)]
        public decimal UnitPrice { get; set; }

        [Required]
        [MaxLength(20)]
        public string PaymentMethod { get; set; } = string.Empty; // "Tiền mặt", "Chuyển khoản"

        [ForeignKey("ShiftReportId")]
        public virtual ShiftReportModel ShiftReport { get; set; }
    }
}
