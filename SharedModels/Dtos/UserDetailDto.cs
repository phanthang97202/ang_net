﻿namespace SharedModels.Dtos
{
    public class UserDetailDto
    {
        public string? Id { get; set; }
        public string? FullName { get; set; }
        public string Avatar {  get; set; }
        public string Address { get; set; }
        public bool FlagActive { get; set; }
        public string? Email { get; set; }
        public string[]? Roles { get; set; }
        public string? PhoneNumber { get; set; }
        public bool TwoFacotrEnabled { get; set; }
        public bool PhoneNumberConfirmed { get; set; }
        public int AccessFailedCount { get; set; }
    }
}
