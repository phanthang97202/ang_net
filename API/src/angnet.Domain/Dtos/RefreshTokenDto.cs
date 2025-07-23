namespace angnet.Domain.Dtos
{
    public class RefreshTokenDto
    {
        public string UserId { get; set; } = string.Empty;
        public string RefreshToken { get; set; } = string.Empty;
    }
}
