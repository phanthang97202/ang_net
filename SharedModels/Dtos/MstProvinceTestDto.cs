using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SharedModels.Dtos
{
    public class MstProvinceTestDto
    {
        public string ProvinceCode { get; set; } = string.Empty; // Mã tỉnh/thành phố
        public string ProvinceName { get; set; } = string.Empty; // Tên tỉnh/thành phố 
        public string TenantId { get; set; } = string.Empty;
        public bool FlagActive { get; set; } // Trạng thái
        public string CreatedBy { get; set; } = string.Empty; // Người tạo
        public string UpdatedBy { get; set; } = string.Empty; // Người cập nhật
        public DateTime CreatedDTime { get; set; } // Thời gian tạo
        public DateTime UpdatedDTime { get; set; } // Thời gian tạo
    }
}
