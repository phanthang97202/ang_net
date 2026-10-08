using System.ComponentModel.DataAnnotations;

namespace angnet.Domain.Dtos;

public class AccountCredentialsDto
{
    [Required, RegularExpression(@"^[a-zA-Z0-9][a-zA-Z0-9._-]{2,31}$")]
    public string UserName { get; set; } = "";
    [Required, StringLength(128, MinimumLength = 8)]
    public string Password { get; set; } = "";
}

public class AdminAccountCreateDto : AccountCredentialsDto
{
    private string? email;
    [EmailAddress, MaxLength(256)]
    public string? Email
    {
        get => email;
        set => email = string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }
    [Required, MaxLength(100)]
    public string FullName { get; set; } = "";
}

public class AdminPasswordResetDto
{
    [Required, StringLength(128, MinimumLength = 8)]
    public string Password { get; set; } = "";
}
