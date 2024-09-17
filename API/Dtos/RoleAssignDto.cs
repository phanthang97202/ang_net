namespace API.Dtos
{
    public class RoleAssignDto
    {
        public string UserId { get; set; } = null!;
        public string RoleId { get; set; } = null!;
    }

    public class UnRoleAssignDto : RoleAssignDto
    {

    }
}
