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
    public class ShiftReportModel : BaseModel
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Required]
        public DateOnly ShiftDate { get; set; }

        [Required]
        [MaxLength(50)]
        public string ShiftType { get; set; } = string.Empty; // "Ca ngày", "Ca đêm"

        [Required]
        public DateTime StartTime { get; set; }

        [Required]
        public DateTime EndTime { get; set; }

        [Required]
        [MaxLength(100)]
        public string ReceptionistName { get; set; } = string.Empty;

        [Precision(18, 2)]
        public decimal TotalCash { get; set; }

        [Precision(18, 2)]
        public decimal TotalTransfer { get; set; }

        [Precision(18, 2)]
        public decimal TotalExpense { get; set; }

        [Precision(18, 2)]
        public decimal HandoverAmount { get; set; }

        [MaxLength(200)]
        public string ReceiverName { get; set; } = string.Empty;

        // Navigation properties
        public virtual ICollection<ShiftReportTransactionModel> Transactions { get; set; } = new List<ShiftReportTransactionModel>();
        public virtual ICollection<ShiftReportRoomSaleModel> RoomSales { get; set; } = new List<ShiftReportRoomSaleModel>();
    }
}
