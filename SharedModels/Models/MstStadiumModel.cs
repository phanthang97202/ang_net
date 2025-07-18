﻿using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema; 

namespace SharedModels.Models
{
    public class MstStadiumModel : BaseModel
    {
        [Key]
        [StringLength(250, ErrorMessage = "Length of StadiumCode is invalid (<= 250 characters)")]
        public string StadiumCode { get; set; } = string.Empty; // Mã sân
        [ForeignKey("StadiumTypeCode")]
        public string StadiumTypeCode { get; set; } = string.Empty; // Mã loại sân
        [ForeignKey("StadiumStatusCode")]
        public string StadiumStatusCode { get; set; } = string.Empty; // Mã tình trạng sân
        [ForeignKey("DistrictCode")]
        public string DistrictCode { get; set; } = string.Empty; // Mã quận/huyện sân
        public string TenantId { get; set; } = string.Empty; // Mã Tenant (ví dụ: "tenant1", "tenant2")
        public bool FlagStadiumRent { get; set; } // Sân đã được thuê chưa 
        public string StadiumName { get; set; } = string.Empty; // Tên sân bóng
        public decimal StadiumPrice { get; set; }  // Giá thuê sân bóng
        public string StadiumDescription { get;  set; } = string.Empty; // Mô tả sân bóng
        public string StadiumAddress { get; set; } = string.Empty; // Địa chỉ sân bóng
        public decimal StadiumSalePercent { get; set; } // % khuyến mãi
        public string Remark { get; set; } = string.Empty; // Ghi chú 
    }
}