namespace angnet.Domain.Dtos
{
    public class UserDetailDto
    {
        public string Id { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Avatar { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public bool FlagActive { get; set; }
        public string? Email { get; set; }
        public string[]? Roles { get; set; }
        public string? PhoneNumber { get; set; }
        public bool TwoFacotrEnabled { get; set; }
        public bool PhoneNumberConfirmed { get; set; }
        public int AccessFailedCount { get; set; }
    }
}
