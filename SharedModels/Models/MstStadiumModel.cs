using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace SharedModels.Models
{
    public class MstStadiumModel
    {
        public string Id { get; set; } = Guid.NewGuid().ToString(); // Id sân bóng
        [Key]
        [Required]
        [StringLength(250, ErrorMessage = "Length of StadiumCode is invalid (<= 250 characters)")]
        public string StadiumCode { get; set; } = string.Empty; // Mã sân
        [Required]
        public string StadiumTypeCode { get; set; } = string.Empty; // Mã loại sân
        [Required]
        public string StadiumStatusCode { get; set; } = string.Empty; // Mã tình trạng sân
        public string StadiumDistrictCode { get; set; } = string.Empty; // Mã quận/huyện sân
        public bool FlagStadiumRent { get; set; } // Sân đã được thuê chưa
        public DateTime StadiumRentDTimeFrom { get; set; } // Sân thuê trong thời gian nào
        public DateTime StadiumRentDTimeTo { get; set; } // Sân thuê trong thời gian nào
        public bool FlagActive { get; set; }  // Mã tình trạng sân bóng
        public string StadiumName { get; set; } = string.Empty; // Tên sân bóng
        public decimal StadiumPrice { get; set; }  // Giá thuê sân bóng
        public string StadiumDescription { get;  set; } = string.Empty; // Mô tả sân bóng
        public string StadiumAddress { get; set; } = string.Empty; // Địa chỉ sân bóng
        public bool FlagSale { get; set; } // Có khuyến mãi không
        public decimal StadiumSalePrice { get; set; } // Có khuyến mãi không
        public DateTime CreatedDTime { get; set; } // Thời gian tạo
        public DateTime UpdatedDTime { get; set; } // Thời gian tạo
    }
}