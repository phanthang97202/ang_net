using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace angnet.Domain.Enums
{
    public enum ENewsCommentReportStatus
    {
        Pending,   // Chờ xử lý
        Reviewed,  // Đã xem
        ActionTaken, // Đã xử lý (ẩn comment, cảnh cáo user, v.v.)
        Dismissed  // Bỏ qua
    }
}
