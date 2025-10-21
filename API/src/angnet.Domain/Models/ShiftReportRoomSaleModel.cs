using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace angnet.Domain.Models
{
    public class ShiftReportRoomSaleModel:BaseModel
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int ShiftReportId { get; set; }

        [Required]
        [MaxLength(20)]
        public string RoomNumber { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string RoomCategory { get; set; } = string.Empty; // "KHÁCH GIỜ", "KHÁCH ĐÊM", "KHÁCH NGÀY"

        [Required]
        [Precision(18, 2)]
        public decimal UnitPrice { get; set; }

        [ForeignKey("ShiftReportId")]
        public virtual ShiftReportModel ShiftReport { get; set; }
    }
}
