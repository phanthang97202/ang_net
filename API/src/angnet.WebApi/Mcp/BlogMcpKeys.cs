using System.Security.Cryptography;
using System.Text;

namespace angnet.WebApi.Mcp;

public static class BlogMcpKeys
{
    private const string SigningError = "Mcp__SigningKey is not a valid RSA private key. "
        + "Use an unencrypted PEM private key or base64 DER (PKCS#1/PKCS#8), at least 2048 bits. "
        + "Do not use a password, public key or the 32-byte encryption key. "
        + "Set Mcp__Enabled=false to run the blog without MCP while correcting this secret.";

    public static RSA ReadSigningKey(string? value)
    {
        if (string.IsNullOrWhiteSpace(value) || value.Length > 32_768)
            throw new InvalidOperationException(SigningError);
        var rsa = RSA.Create();
        try
        {
            var key = value.Trim();
            if (key.Contains("-----BEGIN", StringComparison.Ordinal)) ImportPem(rsa, key);
            else
            {
                var bytes = Convert.FromBase64String(key);
                try
                {
                    // Some secret managers store base64 of the entire PEM file rather than its DER content.
                    if (Encoding.ASCII.GetString(bytes.AsSpan(0, Math.Min(bytes.Length, 64)))
                        .TrimStart().StartsWith("-----BEGIN", StringComparison.Ordinal))
                        ImportPem(rsa, Encoding.UTF8.GetString(bytes));
                    else ImportDer(rsa, bytes);
                }
                finally { CryptographicOperations.ZeroMemory(bytes); }
            }
            if (rsa.KeySize < 2048) throw new CryptographicException();
            return rsa;
        }
        catch (Exception error) when (error is FormatException or ArgumentException or CryptographicException)
        {
            rsa.Dispose();
            // Do not log the secret, decoded data, or provider exception details.
            throw new InvalidOperationException(SigningError);
        }
        catch { rsa.Dispose(); throw; }
    }

    private static void ImportPem(RSA rsa, string key)
    {
        key = key.Replace("\\r\\n", "\n", StringComparison.Ordinal).Replace("\\n", "\n", StringComparison.Ordinal);
        if (!key.Contains("-----BEGIN PRIVATE KEY-----", StringComparison.Ordinal)
            && !key.Contains("-----BEGIN RSA PRIVATE KEY-----", StringComparison.Ordinal))
            throw new ArgumentException();
        rsa.ImportFromPem(key);
    }

    private static void ImportDer(RSA rsa, byte[] bytes)
    {
        int consumed;
        try { rsa.ImportRSAPrivateKey(bytes, out consumed); }
        catch (CryptographicException) { rsa.ImportPkcs8PrivateKey(bytes, out consumed); }
        // Reject a valid key followed by junk, a truncated value, or concatenated keys.
        if (consumed != bytes.Length) throw new CryptographicException();
    }

    public static byte[] ReadEncryptionKey(string? value)
    {
        if (!string.IsNullOrWhiteSpace(value) && value.Length <= 256)
        {
            try
            {
                var bytes = Convert.FromBase64String(value);
                if (bytes.Length == 32) return bytes;
                CryptographicOperations.ZeroMemory(bytes);
            }
            catch (FormatException) { }
        }
        throw new InvalidOperationException("Mcp__EncryptionKey must be base64 of exactly 32 random bytes. "
            + "It is separate from Mcp__SigningKey. Set Mcp__Enabled=false to run without MCP while correcting this secret.");
    }
}
