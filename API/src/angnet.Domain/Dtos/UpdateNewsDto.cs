using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace angnet.Domain.Dtos
{
    public class UpdateNewsDto
    {
        public string NewsId { get; set; } = string.Empty;
        public string Thumbnail { get; set; } = string.Empty; // Ảnh thu nhỏ bài viết
        public string CategoryNewsId { get; set; } = string.Empty; // Danh mục bài viết
        public string ShortTitle { get; set; } = string.Empty; // Tiêu đề ngắn bài viết
        public string ShortTitleEn { get; set; } = string.Empty; // Tiêu đề tiếng Anh (không bắt buộc)
        public string ShortDescription { get; set; } = string.Empty; // Mô tả ngắn bài viết
        public string ShortDescriptionEn { get; set; } = string.Empty; // Mô tả tiếng Anh (không bắt buộc)
        public string ContentBody { get; set; } = string.Empty; // Nội dung bài viết
        public string ContentBodyEn { get; set; } = string.Empty; // Nội dung tiếng Anh (không bắt buộc)
        public bool FlagActive { get; set; } // Trạng thái bài viết

        public List<HashTagNewsDto> LstHashTagNews { get; set; } = new List<HashTagNewsDto>(); // Từ khóa bài viết
        public List<HashTagNewsDto> LstHashTagNewsEn { get; set; } = new List<HashTagNewsDto>(); // Từ khóa tiếng Anh

        public List<RefFileNewsDto> LstRefFileNews { get; set; } = new List<RefFileNewsDto>(); //  File đính kèm  
    }
}
