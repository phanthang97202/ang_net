using System.Net;
using System.Security.Claims;
using angnet.Application.Interfaces.Services;
using angnet.Domain.Dtos;
using angnet.WebApi.Controllers;
using angnet.WebApi.Security;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Moq;

namespace angnet.McpTests;

[TestClass]
public class TurnstileTests
{
    private sealed class Handler(string json, HttpStatusCode status = HttpStatusCode.OK) : HttpMessageHandler
    {
        public int Calls;
        public string Body = "";
        public bool Throw;
        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            Calls++;
            Assert.AreEqual("https://challenges.cloudflare.com/turnstile/v0/siteverify", request.RequestUri!.ToString());
            Assert.AreEqual(HttpMethod.Post, request.Method);
            Body = await request.Content!.ReadAsStringAsync(cancellationToken);
            if (Throw) throw new HttpRequestException("offline");
            return new HttpResponseMessage(status) { Content = new StringContent(json) };
        }
    }

    private static TurnstileVerifier Verifier(Handler handler, string secret = "unit-test-secret", string hosts = "blog.example,www.blog.example", string environment = "Production")
    {
        var host = new Mock<IHostEnvironment>();
        host.SetupGet(x => x.EnvironmentName).Returns(environment);
        return new TurnstileVerifier(new HttpClient(handler), Options.Create(new TurnstileOptions
        { SecretKey = secret, AllowedHostnames = hosts }), host.Object, NullLogger<TurnstileVerifier>.Instance);
    }

    [TestMethod]
    public async Task Valid_Token_Requires_Exact_Hostname_And_Comment_Action()
    {
        var handler = new Handler("""{"success":true,"hostname":"BLOG.EXAMPLE","action":"news_comment"}""");
        Assert.AreEqual(TurnstileResult.Valid, await Verifier(handler).VerifyAsync("a+b&c", default));
        StringAssert.Contains(handler.Body, "secret=unit-test-secret");
        StringAssert.Contains(handler.Body, "response=a%2Bb%26c");
    }

    [DataTestMethod]
    [DataRow("null")]
    [DataRow("{}")]
    [DataRow("{\"success\":false,\"error-codes\":[\"timeout-or-duplicate\"]}")]
    [DataRow("{\"success\":true,\"hostname\":\"evil.blog.example\",\"action\":\"news_comment\"}")]
    [DataRow("{\"success\":true,\"hostname\":\"blog.example\",\"action\":\"login\"}")]
    [DataRow("{\"success\":true,\"hostname\":\"blog.example\"}")]
    public async Task Invalid_Expired_Replayed_Or_Wrong_Context_Is_Rejected(string json)
    {
        Assert.AreEqual(TurnstileResult.Invalid, await Verifier(new Handler(json)).VerifyAsync("token", default));
    }

    [TestMethod]
    public async Task Missing_Or_Oversized_Token_Does_Not_Call_Cloudflare()
    {
        var handler = new Handler("{}");
        foreach (var token in new[] { null, "", "   ", new string('a', 2049) })
            Assert.AreEqual(TurnstileResult.Invalid, await Verifier(handler).VerifyAsync(token, default));
        Assert.AreEqual(0, handler.Calls);
    }

    [DataTestMethod]
    [DataRow("", "blog.example")]
    [DataRow("unit-test-secret", "")]
    [DataRow("1x0000000000000000000000000000000AA", "blog.example")]
    public async Task Missing_Configuration_And_Production_Test_Secrets_Fail_Closed(string secret, string hosts)
    {
        var handler = new Handler("{}");
        Assert.AreEqual(TurnstileResult.Unavailable, await Verifier(handler, secret, hosts).VerifyAsync("token", default));
        Assert.AreEqual(0, handler.Calls);
    }

    [DataTestMethod]
    [DataRow("invalid-json", 200, false)]
    [DataRow("{}", 503, false)]
    [DataRow("{}", 200, true)]
    public async Task Provider_Errors_Fail_Closed(string body, int status, bool offline)
    {
        var handler = new Handler(body, (HttpStatusCode)status) { Throw = offline };
        Assert.AreEqual(TurnstileResult.Unavailable, await Verifier(handler).VerifyAsync("token", default));
    }

    [DataTestMethod]
    [DataRow(false, TurnstileResult.Invalid)]
    [DataRow(true, TurnstileResult.Invalid)]
    [DataRow(false, TurnstileResult.Unavailable)]
    [DataRow(true, TurnstileResult.Unavailable)]
    public async Task Controller_Never_Writes_Comment_Or_Reply_When_Verification_Fails(bool reply, TurnstileResult result)
    {
        var comments = new Mock<INewsCommentService>(MockBehavior.Strict);
        var verifier = new Mock<ITurnstileVerifier>();
        verifier.Setup(x => x.VerifyAsync("token", It.IsAny<CancellationToken>())).ReturnsAsync(result);
        var controller = new NewsCommentController(comments.Object, verifier.Object)
        { ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() } };
        var response = (OkObjectResult)await controller.Comment(new NewsCommentCreateDto
        { TurnstileToken = "token", Content = "hello", ParentCommentId = reply ? "root" : null! }, null!, null!, null!);
        Assert.IsFalse(((ApiResponse<NewsCommentDto>)response.Value!).Success);
        comments.VerifyNoOtherCalls();
    }

    [TestMethod]
    public async Task Public_Test_Keys_Only_Work_In_Development_And_Still_Check_Hostname()
    {
        var handler = new Handler("""{"success":true,"hostname":"localhost","action":"test"}""");
        Assert.AreEqual(TurnstileResult.Valid, await Verifier(handler,
            "1x0000000000000000000000000000000AA", "localhost", "Development").VerifyAsync("token", default));
        Assert.AreEqual(TurnstileResult.Invalid, await Verifier(handler,
            "1x0000000000000000000000000000000AA", "blog.example", "Development").VerifyAsync("token", default));
    }

    [TestMethod]
    public async Task Controller_Only_Passes_Verified_Requests_To_Comment_Service()
    {
        var request = new NewsCommentCreateDto { TurnstileToken = "token", Content = "hello" };
        var comments = new Mock<INewsCommentService>();
        comments.Setup(x => x.AddComment(It.IsAny<ClaimsPrincipal>(), request)).ReturnsAsync(new ApiResponse<NewsCommentDto>());
        var verifier = new Mock<ITurnstileVerifier>();
        verifier.Setup(x => x.VerifyAsync("token", It.IsAny<CancellationToken>())).ReturnsAsync(TurnstileResult.Valid);
        var controller = new NewsCommentController(comments.Object, verifier.Object)
        { ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() } };
        await controller.Comment(request, null!, null!, null!);
        comments.Verify(x => x.AddComment(It.IsAny<ClaimsPrincipal>(), request), Times.Once);
        Assert.AreEqual("", request.TurnstileToken);
    }
}
