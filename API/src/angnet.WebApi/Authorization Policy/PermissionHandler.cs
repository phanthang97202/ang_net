using Microsoft.AspNetCore.Authorization;

namespace angnet.WebApi.Authorization_Policy
{
    /*
        Kiem tra quyen theo ma quyen dang "module.action" (blog.create, audittrail.view...).

        Quyen duoc gan vao VAI TRO (bang AspNetRoleClaims, ClaimType = "permission"),
        nguoi dung co vai tro nao thi huong quyen cua vai tro do. Luc dang nhap,
        GenerateAccessToken gop quyen cua tat ca vai tro roi nhet thang vao JWT,
        nen o day chi doc claim trong token chu khong tra DB.

        Dung o controller:  [Authorize(Policy = "blog.create")]
        Policy duoc dang ky dong trong Program.cs qua PermissionPolicyProvider.
    */
    public class PermissionRequirement : IAuthorizationRequirement
    {
        public string Permission { get; }

        public PermissionRequirement(string permission)
        {
            Permission = permission;
        }
    }

    public class PermissionHandler : AuthorizationHandler<PermissionRequirement>
    {
        // Ten claim chua ma quyen trong JWT. Phai khop voi hang so cung ten ben
        // AccountRespository (noi sinh token).
        public const string PermissionClaimType = "permission";

        // Vai tro duoc di qua moi kiem tra quyen.
        public const string SuperRole = "Admin";

        protected override Task HandleRequirementAsync(
            AuthorizationHandlerContext context,
            PermissionRequirement requirement)
        {
            if (context.User.Identity?.IsAuthenticated != true)
            {
                return Task.CompletedTask;
            }

            // Admin bo qua moi kiem tra quyen. Co chu y: neu Admin cung phai co quyen
            // thi chi can seed thieu mot ma quyen la tu khoa minh ra khoi man quan tri,
            // va khong con duong nao vao de tu cap lai quyen do.
            if (context.User.IsInRole(SuperRole))
            {
                context.Succeed(requirement);
                return Task.CompletedTask;
            }

            var hasPermission = context.User.Claims.Any(
                c => c.Type == PermissionClaimType
                     && string.Equals(c.Value, requirement.Permission, StringComparison.Ordinal));

            if (hasPermission)
            {
                context.Succeed(requirement);
            }

            return Task.CompletedTask;
        }
    }
}
