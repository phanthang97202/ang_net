namespace SharedModels.Models
{
    public class BaseModel
    {
        public bool FlagActive { get; set; } // Trạng thái
        public string CreatedBy { get; set; } = string.Empty; // Người tạo
        public string UpdatedBy { get; set; } = string.Empty; // Người cập nhật
        public DateTime CreatedDTime { get; set; } // Thời gian tạo
        public DateTime UpdatedDTime { get; set; } // Thời gian tạo
    }
}
