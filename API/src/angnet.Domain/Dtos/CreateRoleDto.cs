using System.ComponentModel.DataAnnotations;

namespace angnet.Domain.Dtos
{
    public class CreateRoleDto
    {
        [Required(ErrorMessage = "RoleName is required! ")]
        public string RoleName { get; set; } = null!;
    }
}
