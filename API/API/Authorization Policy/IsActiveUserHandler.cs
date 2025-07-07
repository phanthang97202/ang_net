using API.API.Models;
using API.Shared.Utilities;
using TCommonUtils = CommonUtils.CommonUtils.CommonUtils;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using SharedModels.Dtos;
using System.Security.Claims;
using API.Application.Interfaces.Repositories;
using DocumentFormat.OpenXml.Spreadsheet;

namespace API.API.Authorization_Policy
{
    public class IsActiveRequirement : IAuthorizationRequirement
    {
        public IsActiveRequirement() { }
    }

    public class IsActiveUserHandler : AuthorizationHandler<IsActiveRequirement>
    {
        private readonly UserManager<AppUser> _userManager;
        private readonly WriteLog _logger;
        private readonly IAccountRespository _accountRespository;

        public IsActiveUserHandler(
            UserManager<AppUser> userManager
            , WriteLog logger
            , IAccountRespository accountRespository
        ) 
        {
            _userManager = userManager;
            _logger = logger;
            _accountRespository = accountRespository;
        }

        // Check user is active? => If user is inactive, app will prevent to access all api
        protected async override Task HandleRequirementAsync(AuthorizationHandlerContext context
                                                        , IsActiveRequirement requirement
        )
        {
            // Không xử lý nếu chưa đăng nhập => tránh lỗi khi run app lần đầu tiên
            var isLogin = context.User.Identity?.IsAuthenticated;
            if(isLogin == false)
            {
                context.Succeed(requirement);
            }
            else
            {
                var userId = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    
                    _logger.LogWarning($"========UserWasBanned: BANNED USER t=======\n user: {userId} at DTime: {TCommonUtils.DTimeNow()}");
                    return;
                }

                var user = await _userManager.FindByIdAsync(userId);
                if (user != null && user.FlagActive)
                {
                    context.Succeed(requirement);
                }

                // revoke token
                await _accountRespository.LogoutAllDevice(userId);
            }
        }
    }
}
