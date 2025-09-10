using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace angnet.Domain.Models
{
    public class TenantAddressModel
    {
        // Mã bưu chính
        public string PostCode { get; set; } = string.Empty;

        // Tên đường, số nhà
        public string Street { get; set; } = string.Empty;

        // Phường / xã
        public string Ward { get; set; } = string.Empty;

        // Quận / huyện
        public string District { get; set; } = string.Empty;

        // Thành phố / tỉnh
        public string City { get; set; } = string.Empty;

        // Quốc gia
        public string Country { get; set; } = string.Empty;

        // Tọa độ GPS (nếu cần tích hợp bản đồ / định vị)
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }

        // Địa chỉ đầy đủ dạng chuỗi (có thể sinh tự động từ các field trên)
        public string FullAddress { get; set; } = string.Empty;
    }

}
