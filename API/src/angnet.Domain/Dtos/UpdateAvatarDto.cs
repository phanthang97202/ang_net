using System.ComponentModel.DataAnnotations;

namespace angnet.Domain.Dtos;

public class UpdateAvatarDto : IValidatableObject
{
    [Required]
    [MaxLength(2048)]
    public string AvatarUrl { get; set; } = string.Empty;

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (!Uri.TryCreate(AvatarUrl?.Trim(), UriKind.Absolute, out var uri)
            || uri.Scheme != Uri.UriSchemeHttps || string.IsNullOrWhiteSpace(uri.Host)
            || !string.IsNullOrEmpty(uri.UserInfo))
            yield return new ValidationResult("Vui lòng nhập link ảnh HTTPS hợp lệ.", [nameof(AvatarUrl)]);
    }
}
