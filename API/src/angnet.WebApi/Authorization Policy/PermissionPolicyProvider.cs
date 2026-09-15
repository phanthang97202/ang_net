using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Options;

namespace angnet.WebApi.Authorization_Policy
{
    /*
        Sinh policy theo yeu cau thay vi khai bao san tung cai trong Program.cs.

        Khong co lop nay thi moi ma quyen phai co mot dong AddPolicy rieng - 28 quyen
        la 28 dong, va them quyen moi vao DB lai phai sua code roi deploy lai. O day
        ten policy CHINH LA ma quyen: [Authorize(Policy = "blog.create")] se tu sinh
        ra mot PermissionRequirement("blog.create").

        Quy uoc: ten policy chua dau "." thi coi la ma quyen. Cac policy dat san
        (IsActiveUser...) khong co dau "." nen roi thang xuong provider mac dinh.
    */
    public class PermissionPolicyProvider : IAuthorizationPolicyProvider
    {
        private readonly DefaultAuthorizationPolicyProvider _fallbackProvider;

        public PermissionPolicyProvider(IOptions<AuthorizationOptions> options)
        {
            _fallbackProvider = new DefaultAuthorizationPolicyProvider(options);
        }

        public Task<AuthorizationPolicy> GetDefaultPolicyAsync()
            => _fallbackProvider.GetDefaultPolicyAsync();

        public Task<AuthorizationPolicy?> GetFallbackPolicyAsync()
            => _fallbackProvider.GetFallbackPolicyAsync();

        public Task<AuthorizationPolicy?> GetPolicyAsync(string policyName)
        {
            if (!string.IsNullOrWhiteSpace(policyName) && policyName.Contains('.'))
            {
                var policy = new AuthorizationPolicyBuilder()
                    .AddRequirements(new PermissionRequirement(policyName))
                    .Build();

                return Task.FromResult<AuthorizationPolicy?>(policy);
            }

            return _fallbackProvider.GetPolicyAsync(policyName);
        }
    }
}
