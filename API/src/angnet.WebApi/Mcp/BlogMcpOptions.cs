namespace angnet.WebApi.Mcp;

public sealed class BlogMcpOptions
{
    public bool Enabled { get; set; }
    public string Issuer { get; set; } = "https://ang-net.onrender.com/";
    public string BlogUrl { get; set; } = "https://phanthang.site";
    public string SigningKey { get; set; } = "";
    public string EncryptionKey { get; set; } = "";
    public string[] RedirectUris { get; set; } = ["https://chatgpt.com/connector_platform_oauth_redirect"];
    public const string ClientId = "phanthang-chatgpt";
    public const string Policy = "BlogMcp";
    public const string ReadScope = "blog.read";
    public const string WriteScope = "blog.write";
    public const string PublishScope = "blog.publish";
    public const string StampClaim = "mcp_security_stamp";
    public string Resource => new Uri(new Uri(Issuer), "mcp").AbsoluteUri;
}
