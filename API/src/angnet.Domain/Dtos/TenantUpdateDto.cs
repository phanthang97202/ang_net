using angnet.Domain.Enums;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace angnet.Domain.Dtos
{
    public class TenantUpdateDto
    {
        public string TenantCode { get; set; } // Tên tenant
        public string TenantName { get; set; } // Tên tenant
        public string OwnedBy { get; set; } // Người sở hữu tenant
        public string TenantPrefixHost { get; set; } = string.Empty; // Tiền tố host (ví dụ: "tenant1", "tenant2")
        public string TenantHost { get; set; } = string.Empty; // Host đầy đủ (ví dụ: "tenant1.example.com")
        public string TenantConnectionString { get; set; } = string.Empty; // Chuỗi kết nối đến cơ sở dữ liệu của tenant
        public string TenantDatabaseName { get; set; } = string.Empty; // Tên cơ sở dữ liệu của tenant
        public string TenantLogo { get; set; } = string.Empty; // Logo của tenant
        public string TenantDescription { get; set; } = string.Empty; // Mô tả về tenant
        public JsonDocument TenantAddress { get; set; } // Địa chỉ của tenant (có thể nhiều địa chỉ)
        public ETenantStatus TenantStatus { get; set; } // Trạng thái 
        public string Remark { get; set; } = string.Empty; // Ghi chú
        public bool FlagActive { get; set; } // Trạng thái
        public string UpdatedBy { get; set; } = string.Empty; // Người cập nhật
        public DateTime UpdatedDTime { get; set; } // Thời gian tạo
    }
}
