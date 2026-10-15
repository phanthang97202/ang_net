using System.ComponentModel.DataAnnotations;

namespace angnet.Domain.Dtos;

public class UpdateDisplayNameDto
{
    [Required(ErrorMessage = "Vui lòng nhập họ và tên.")]
    [MaxLength(100, ErrorMessage = "Họ và tên tối đa 100 ký tự.")]
    public string FullName { get; set; } = string.Empty;
}
