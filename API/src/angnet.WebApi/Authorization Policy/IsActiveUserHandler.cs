
using angnet.Infrastructure.Data.Services;
using Microsoft.AspNetCore.Authorization;

namespace angnet.WebApi.Authorization_Policy
{
    public class IsActiveRequirement : IAuthorizationRequirement
    {
        public IsActiveRequirement() { }
    }

    public class IsActiveUserHandler : AuthorizationHandler<IsActiveRequirement>
    {
        private readonly AccountSessionService _sessions;
        public IsActiveUserHandler(AccountSessionService sessions) => _sessions = sessions;

        // Validate active status and the current session without changing tokens.
        protected async override Task HandleRequirementAsync(AuthorizationHandlerContext context
                                                        , IsActiveRequirement requirement
        )
        {
            if (await _sessions.IsCurrent(context.User)) context.Succeed(requirement);
        }
    }
}
