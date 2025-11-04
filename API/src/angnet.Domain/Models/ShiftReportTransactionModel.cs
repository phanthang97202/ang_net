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
    public class ShiftReportTransactionModel : BaseModel
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int ShiftReportId { get; set; }

        public int OrderNumber { get; set; }

        [MaxLength(20)]
        public string RoomNumber { get; set; } = string.Empty;

        [MaxLength(50)]
        public string InvoiceCode { get; set; } = string.Empty;

        [MaxLength(50)]
        public string CustomerType { get; set; } = string.Empty;  // "k.ngày", "k.đêm", "k.ngày/out"

        [Precision(18, 2)]
        public decimal? CashAmount { get; set; }

        [Precision(18, 2)]
        public decimal? TransferAmount { get; set; }

        [MaxLength(200)]
        public string PrepaidNote { get; set; } = string.Empty;

        [MaxLength(500)]
        public string ExpenseDescription { get; set; } = string.Empty;  

        [Precision(18, 2)]
        public decimal? ExpenseAmount { get; set; }
        public bool IsUseExpenseForReportRevenue { get; set; } = true;

        [ForeignKey("ShiftReportId")]
        public virtual ShiftReportModel ShiftReport { get; set; }
    }
}
