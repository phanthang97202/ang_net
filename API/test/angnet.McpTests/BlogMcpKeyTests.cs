using System.Security.Cryptography;
using System.Text;
using angnet.WebApi.Mcp;

namespace angnet.McpTests;

[TestClass]
public class BlogMcpKeyTests
{
    [DataTestMethod]
    [DataRow("pkcs1")]
    [DataRow("pkcs8")]
    [DataRow("pem-pkcs1")]
    [DataRow("pem-pkcs8")]
    [DataRow("escaped-pem")]
    [DataRow("base64-pem")]
    public void Signing_Formats_Preserve_The_Key_And_Can_Sign(string format)
    {
        using var original = RSA.Create(2048);
        var value = format switch
        {
            "pkcs1" => Convert.ToBase64String(original.ExportRSAPrivateKey()),
            "pkcs8" => Convert.ToBase64String(original.ExportPkcs8PrivateKey()),
            "pem-pkcs1" => original.ExportRSAPrivateKeyPem(),
            "pem-pkcs8" => original.ExportPkcs8PrivateKeyPem(),
            "escaped-pem" => original.ExportPkcs8PrivateKeyPem().Replace("\n", "\\n"),
            "base64-pem" => Convert.ToBase64String(Encoding.UTF8.GetBytes(original.ExportPkcs8PrivateKeyPem())),
            _ => throw new InvalidOperationException()
        };
        using var imported = BlogMcpKeys.ReadSigningKey(" \n" + value + "\n ");
        CollectionAssert.AreEqual(original.ExportParameters(false).Modulus, imported.ExportParameters(false).Modulus);
        var data = Encoding.UTF8.GetBytes("mcp-key-test");
        Assert.IsTrue(original.VerifyData(data, imported.SignData(data, HashAlgorithmName.SHA256, RSASignaturePadding.Pkcs1),
            HashAlgorithmName.SHA256, RSASignaturePadding.Pkcs1));
    }

    [DataTestMethod]
    [DataRow("placeholder")]
    [DataRow("truncated")]
    [DataRow("random")]
    [DataRow("public-pem")]
    [DataRow("public-der")]
    [DataRow("encrypted-pem")]
    [DataRow("trailing-junk")]
    [DataRow("weak-key")]
    public void Invalid_Or_Unsafe_Signing_Key_Is_Rejected_Without_Leaking_The_Value(string kind)
    {
        using var rsa = RSA.Create(kind == "weak-key" ? 1024 : 2048);
        var bytes = rsa.ExportRSAPrivateKey();
        var value = kind switch
        {
            "placeholder" => "test-placeholder-not-a-real-key",
            "truncated" => Convert.ToBase64String(bytes[..(bytes.Length / 2)]),
            "random" => Convert.ToBase64String(RandomNumberGenerator.GetBytes(32)),
            "public-pem" => rsa.ExportSubjectPublicKeyInfoPem(),
            "public-der" => Convert.ToBase64String(rsa.ExportSubjectPublicKeyInfo()),
            "encrypted-pem" => rsa.ExportEncryptedPkcs8PrivateKeyPem("test-only",
                new PbeParameters(PbeEncryptionAlgorithm.Aes256Cbc, HashAlgorithmName.SHA256, 1000)),
            "trailing-junk" => Convert.ToBase64String([..bytes, 1, 2, 3]),
            "weak-key" => Convert.ToBase64String(bytes),
            _ => throw new InvalidOperationException()
        };
        var error = Assert.ThrowsException<InvalidOperationException>(() => BlogMcpKeys.ReadSigningKey(value));
        StringAssert.Contains(error.Message, "Mcp__SigningKey");
        Assert.IsFalse(error.Message.Contains(value)); Assert.IsNull(error.InnerException);
    }

    [TestMethod]
    public void Encryption_Key_Must_Be_Exactly_32_Bytes_And_Has_Its_Own_Error()
    {
        var bytes = RandomNumberGenerator.GetBytes(32);
        CollectionAssert.AreEqual(bytes, BlogMcpKeys.ReadEncryptionKey(Convert.ToBase64String(bytes)));
        foreach (var bad in new[] { "", "test-placeholder", Convert.ToBase64String(RandomNumberGenerator.GetBytes(16)) })
        {
            var error = Assert.ThrowsException<InvalidOperationException>(() => BlogMcpKeys.ReadEncryptionKey(bad));
            StringAssert.Contains(error.Message, "Mcp__EncryptionKey"); Assert.IsNull(error.InnerException);
        }
    }

    [TestMethod]
    public void Production_Validation_Detects_Invalid_RSA_Before_Configuring_OAuth()
    {
        var settings = new BlogMcpOptions { SigningKey = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32)),
            EncryptionKey = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32)) };
        var error = Assert.ThrowsException<InvalidOperationException>(() => BlogMcpConfiguration.Validate(settings, false));
        StringAssert.Contains(error.Message, "Mcp__SigningKey");
        using var rsa = RSA.Create(2048);
        settings.SigningKey = rsa.ExportPkcs8PrivateKeyPem();
        BlogMcpConfiguration.Validate(settings, false);
    }
}
