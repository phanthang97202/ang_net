using System.Security.Claims;
using System.ComponentModel.DataAnnotations;
using System.IdentityModel.Tokens.Jwt;
using angnet.Application.Interfaces.Repositories;
using angnet.Application.Interfaces.Services;
using angnet.Domain.Dtos;
using angnet.Domain.Models;
using angnet.Infrastructure.Data;
using angnet.Infrastructure.Data.Repositories;
using angnet.Infrastructure.Data.Services;
using angnet.Infrastructure.Mail.Producer;
using angnet.Utility.CommonUtils;
using angnet.WebApi.Controllers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.DependencyInjection;
using Moq;

namespace angnet.InfrastructureTests.Data.Services;

[TestClass]
public class AdminAccountTests
{
    private static AppDbContext Context() => new(new DbContextOptionsBuilder<AppDbContext>()
        .UseNpgsql("Host=localhost;Database=unused;Username=unused;Password=unused").Options);
    private static Mock<UserManager<AppUser>> Users()
    {
        var mock = new Mock<UserManager<AppUser>>(Mock.Of<IUserStore<AppUser>>(),
            null!, null!, null!, null!, null!, null!, null!, null!);
        _ = mock.Object;
        mock.Invocations.Clear(); // Ignore the base constructor's Logger assignment.
        return mock;
    }
    private static Mock<RoleManager<IdentityRole>> Roles() => new(Mock.Of<IRoleStore<IdentityRole>>(),
        Array.Empty<IRoleValidator<IdentityRole>>(), null!, null!, null!);
    private static ClaimsPrincipal Actor(string role = "Admin") => new(new ClaimsIdentity([
        new Claim(ClaimTypes.NameIdentifier, "admin-id"), new Claim(ClaimTypes.Role, role)], "test"));
    private static AdminAccountCreateDto CreateRequest() => new()
    { Email = "existing@example.com", FullName = "Test User", UserName = "user001", Password = "TestPass123!" };

    [TestMethod]
    public async Task Service_RejectsNonAdminForAllOperations()
    {
        using var db = Context();
        var users = Users();
        var service = new AdminAccountService(db, users.Object, Roles().Object, Mock.Of<IAuditTrailService>());
        var actor = Actor("User");
        await Assert.ThrowsExceptionAsync<UnauthorizedAccessException>(() => service.FindByEmail(actor, "a@example.com"));
        await Assert.ThrowsExceptionAsync<UnauthorizedAccessException>(() => service.Create(actor, CreateRequest()));
        await Assert.ThrowsExceptionAsync<UnauthorizedAccessException>(() => service.AddCredentials(actor, "id", CreateRequest()));
        await Assert.ThrowsExceptionAsync<UnauthorizedAccessException>(() => service.ResetPassword(actor, "id", new() { Password = "TestPass123!" }));
        users.VerifyNoOtherCalls();
        Assert.AreEqual("Admin", typeof(AdminAccountsController).GetCustomAttributes(typeof(AuthorizeAttribute), false)
            .Cast<AuthorizeAttribute>().Single().Roles);
    }

    [TestMethod]
    public async Task Create_RefusesExistingEmailWithoutMutatingAccount()
    {
        using var db = Context();
        var users = Users();
        var existing = new AppUser { Id = "google-id", Email = "existing@example.com" };
        users.Setup(x => x.FindByEmailAsync(existing.Email)).ReturnsAsync(existing);
        var service = new AdminAccountService(db, users.Object, Roles().Object, Mock.Of<IAuditTrailService>());
        var response = await service.Create(Actor(), CreateRequest());
        Assert.IsFalse(response.Success);
        Assert.AreEqual("google-id", existing.Id);
        users.Verify(x => x.CreateAsync(It.IsAny<AppUser>(), It.IsAny<string>()), Times.Never);
        users.Verify(x => x.AddPasswordAsync(It.IsAny<AppUser>(), It.IsAny<string>()), Times.Never);
    }

    [TestMethod]
    public async Task AddCredentials_NeverOverwritesAnExistingPassword()
    {
        using var db = Context();
        var users = Users();
        var existing = new AppUser { Id = "same-id", UserName = "old-user", PasswordHash = "existing-hash" };
        users.Setup(x => x.FindByIdAsync(existing.Id)).ReturnsAsync(existing);
        users.Setup(x => x.HasPasswordAsync(existing)).ReturnsAsync(true);
        var service = new AdminAccountService(db, users.Object, Roles().Object, Mock.Of<IAuditTrailService>());
        Assert.IsFalse((await service.AddCredentials(Actor(), existing.Id, CreateRequest())).Success);
        Assert.AreEqual("old-user", existing.UserName);
        Assert.AreEqual("existing-hash", existing.PasswordHash);
        users.Verify(x => x.SetUserNameAsync(It.IsAny<AppUser>(), It.IsAny<string>()), Times.Never);
        users.Verify(x => x.AddPasswordAsync(It.IsAny<AppUser>(), It.IsAny<string>()), Times.Never);
    }

    [TestMethod]
    public async Task AddCredentials_RejectsUsernameOwnedBySomeoneElse()
    {
        using var db = Context();
        var users = Users();
        var existing = new AppUser { Id = "google-id", UserName = "existing@example.com" };
        users.Setup(x => x.FindByIdAsync(existing.Id)).ReturnsAsync(existing);
        users.Setup(x => x.HasPasswordAsync(existing)).ReturnsAsync(false);
        users.Setup(x => x.FindByNameAsync("user001")).ReturnsAsync(new AppUser { Id = "someone-else" });
        var service = new AdminAccountService(db, users.Object, Roles().Object, Mock.Of<IAuditTrailService>());
        Assert.IsFalse((await service.AddCredentials(Actor(), existing.Id, CreateRequest())).Success);
        users.Verify(x => x.SetUserNameAsync(It.IsAny<AppUser>(), It.IsAny<string>()), Times.Never);
    }

    [TestMethod]
    public async Task InvalidInput_IsRejectedBeforeLookingUpUsers()
    {
        using var db = Context();
        var users = Users();
        var service = new AdminAccountService(db, users.Object, Roles().Object, Mock.Of<IAuditTrailService>());
        var request = CreateRequest();
        request.UserName = "name@example.com";
        Assert.IsFalse((await service.Create(Actor(), request)).Success);
        Assert.IsFalse((await service.FindByEmail(Actor(), "not-an-email")).Success);
        Assert.IsFalse((await service.ResetPassword(Actor(), "id", new() { Password = "short" })).Success);
        users.VerifyNoOtherCalls();
    }

    [TestMethod]
    public async Task EmailLookup_ReturnsExistingIdAndNoPasswordSecrets()
    {
        using var db = Context();
        var users = Users();
        var existing = new AppUser { Id = "google-id", UserName = "existing@example.com", Email = "existing@example.com", FullName = "Existing User" };
        users.Setup(x => x.FindByEmailAsync(existing.Email)).ReturnsAsync(existing);
        users.Setup(x => x.HasPasswordAsync(existing)).ReturnsAsync(false);
        users.Setup(x => x.GetRolesAsync(existing)).ReturnsAsync(new List<string> { "Movie Viewer" });
        var service = new AdminAccountService(db, users.Object, Roles().Object, Mock.Of<IAuditTrailService>());
        var result = await service.FindByEmail(Actor(), " existing@example.com ");
        Assert.IsTrue(result.Success);
        Assert.AreEqual(existing.Id, result.Data.Id);
        Assert.IsFalse(result.Data.HasPassword);
        CollectionAssert.AreEqual(new[] { "Movie Viewer" }, result.Data.Roles!);
        Assert.IsFalse(typeof(UserDetailDto).GetProperties().Any(x => x.Name is "Password" or "PasswordHash" or "SecurityStamp"));
    }

    [TestMethod]
    public void PublicPasswordRegistration_IsDisabledEvenWhenCalledDirectly()
    {
        var repository = new Mock<IAccountRespository>(MockBehavior.Strict);
        var controller = new AccountController(repository.Object, null!, null!, new ConfigurationBuilder().Build());
        Assert.AreEqual(403, ((ObjectResult)controller.Register(new()).Result!).StatusCode);
        Assert.AreEqual(403, ((ObjectResult)controller.GetRegisterCode("a@example.com").Result!).StatusCode);
        repository.VerifyNoOtherCalls();
    }

    [DataTestMethod]
    [DataRow("user001", false)]
    [DataRow("existing@example.com", true)]
    public async Task Login_ResolvesUsernameOrEmailWithoutLoggingPassword(string identifier, bool email)
    {
        using var db = Context();
        var users = Users();
        var user = new AppUser { Id = "existing-id", FlagActive = true, LockoutEnabled = false };
        if (email) users.Setup(x => x.FindByEmailAsync(identifier)).ReturnsAsync(user);
        else users.Setup(x => x.FindByNameAsync(identifier)).ReturnsAsync(user);
        users.Setup(x => x.CheckPasswordAsync(user, "Secret123!")).ReturnsAsync(false);
        var config = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        { ["AspIdentity:MaxFailedAccessAttempts"] = "5" }).Build();
        var audit = new Mock<IAuditTrailService>();
        AuditTrailDto? recorded = null;
        audit.Setup(x => x.Create(It.IsAny<AuditTrailDto>())).Callback<AuditTrailDto>(x => recorded = x)
            .ReturnsAsync(new ApiResponse<AuditTrailDto>());
        var accessor = new HttpContextAccessor { HttpContext = new DefaultHttpContext() };
        var logger = new Mock<ILogger<WriteLog>>();
        var repository = new AccountRespository(users.Object, new RabbitMqEmailProducer(config), Roles().Object,
            accessor, config, db, new WriteLog(logger.Object, accessor), audit.Object);
        Assert.IsFalse((await repository.Login(new LoginDto { Email = " " + identifier + " ", Password = "Secret123!" })).Success);
        Assert.IsNotNull(recorded);
        Assert.IsFalse(recorded.Description.Contains("Secret123!"));
        Assert.IsFalse(logger.Invocations.Any(x => x.Arguments.Any(arg => arg?.ToString()?.Contains("Secret123!") == true)));
        if (email) users.Verify(x => x.FindByNameAsync(It.IsAny<string>()), Times.Never);
        else users.Verify(x => x.FindByEmailAsync(It.IsAny<string>()), Times.Never);
    }

    [TestMethod]
    public void Model_EnforcesUniqueNormalizedEmailWithoutReplacingUserIds()
    {
        using var db = Context();
        var user = db.Model.FindEntityType(typeof(AppUser))!;
        Assert.IsTrue(user.GetIndexes().Single(x => x.GetDatabaseName() == "EmailIndex").IsUnique);
        Assert.AreEqual("Id", user.FindPrimaryKey()!.Properties.Single().Name);
    }

    [DataTestMethod]
    [DataRow(null)]
    [DataRow("")]
    [DataRow("   ")]
    public async Task CreateAndLogin_SupportMultipleAccountsWithoutEmail(string? email)
    {
        var services = new ServiceCollection();
        services.AddLogging();
        services.AddDbContext<AppDbContext>(options => options.UseSqlite("Data Source=:memory:"));
        services.AddIdentityCore<AppUser>(options => options.User.RequireUniqueEmail = false)
            .AddRoles<IdentityRole>().AddEntityFrameworkStores<AppDbContext>()
            .AddUserValidator<OptionalEmailUserValidator>();
        using var provider = services.BuildServiceProvider();
        using var scope = provider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await db.Database.OpenConnectionAsync();
        await db.Database.EnsureCreatedAsync();
        var users = scope.ServiceProvider.GetRequiredService<UserManager<AppUser>>();
        var roles = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
        Assert.IsTrue((await roles.CreateAsync(new IdentityRole("User"))).Succeeded);
        var audit = new Mock<IAuditTrailService>();
        audit.Setup(x => x.Create(It.IsAny<AuditTrailDto>())).ReturnsAsync(new ApiResponse<AuditTrailDto>());
        var service = new AdminAccountService(db, users, roles, audit.Object);
        for (var i = 1; i <= 2; i++)
        {
            var request = CreateRequest();
            request.Email = email;
            request.UserName = $"user00{i}";
            Assert.IsTrue(Validator.TryValidateObject(request, new ValidationContext(request), new List<ValidationResult>(), true));
            var response = await service.Create(Actor(), request);
            Assert.IsTrue(response.Success, response.ErrorMessage);
            Assert.IsNull(response.Data.Email);
            var user = (await users.FindByNameAsync(request.UserName))!;
            Assert.IsNull(user.NormalizedEmail);
            Assert.IsTrue(await users.CheckPasswordAsync(user, request.Password));
            Assert.IsTrue(await users.IsInRoleAsync(user, "User"));
            Assert.IsFalse(await users.IsInRoleAsync(user, "Admin"));
        }

        var config = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["AspIdentity:MaxFailedAccessAttempts"] = "5",
            ["JWTSetting:securityKey"] = new string('x', 64),
            ["JWTSetting:validAudience"] = "test-audience",
            ["JWTSetting:validIssuer"] = "test-issuer",
            ["JWTSetting:accessTokenExpired"] = "1",
            ["JWTSetting:refreshTokenExpired"] = "7",
        }).Build();
        var accessor = new HttpContextAccessor { HttpContext = new DefaultHttpContext() };
        var repository = new AccountRespository(users, new RabbitMqEmailProducer(config), roles,
            accessor, config, db, new WriteLog(Mock.Of<ILogger<WriteLog>>(), accessor), audit.Object);
        var login = await repository.Login(new LoginDto { Email = "USER001", Password = "TestPass123!" });
        Assert.IsTrue(login.Success, login.ErrorMessage);
        var token = new JwtSecurityTokenHandler().ReadJwtToken(login.Data.AccessToken);
        Assert.AreEqual((await users.FindByNameAsync("user001"))!.Id,
            token.Claims.Single(x => x.Type == JwtRegisteredClaimNames.NameId).Value);
        Assert.AreEqual(1, await db.RefreshToken.CountAsync());
    }

    [TestMethod]
    public async Task OptionalEmailValidator_PreservesUniquenessAndAllowsCurrentOwner()
    {
        var users = Users();
        var user = new AppUser { Id = "current", Email = "existing@example.com" };
        users.Object.ErrorDescriber = new IdentityErrorDescriber();
        users.Setup(x => x.GetEmailAsync(user)).ReturnsAsync(user.Email);
        users.Setup(x => x.GetUserIdAsync(It.IsAny<AppUser>())).ReturnsAsync((AppUser u) => u.Id);
        users.Setup(x => x.FindByEmailAsync(user.Email)).ReturnsAsync(user);
        var validator = new OptionalEmailUserValidator();
        Assert.IsTrue((await validator.ValidateAsync(users.Object, user)).Succeeded);
        users.Setup(x => x.FindByEmailAsync(user.Email)).ReturnsAsync(new AppUser { Id = "other" });
        Assert.AreEqual("DuplicateEmail", (await validator.ValidateAsync(users.Object, user)).Errors.Single().Code);
        users.Setup(x => x.GetEmailAsync(user)).ReturnsAsync("invalid-email");
        Assert.AreEqual("InvalidEmail", (await validator.ValidateAsync(users.Object, user)).Errors.Single().Code);
    }
}
