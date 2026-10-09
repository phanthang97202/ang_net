using System.Security.Claims;
using angnet.Domain.Dtos;
using angnet.WebApi.Cloudinary;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Configuration;

namespace angnet.WebApi.Controllers;

[ApiController, Route("api/Reel/UploadSignature"), EnableRateLimiting("API")]
public class ReelUploadsController(IConfiguration configuration) : ControllerBase
{
    [HttpGet("image"), Authorize(Policy = "reel.upload_image")]
    public IActionResult Image() => Signature("image");

    [HttpGet("video"), Authorize(Policy = "reel.upload_video")]
    public IActionResult Video() => Signature("video");

    private IActionResult Signature(string kind)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();
        if (!CloudinaryAccount.TryGetSettings(configuration, out var cloudName, out var apiKey, out var secret))
            return StatusCode(503, new ApiResponse<ArchiveUploadSignatureDto>("Cloudinary chưa được cấu hình trên máy chủ"));
        var image = kind == "image";
        var formats = image ? "jpg,jpeg,png,webp" : "mp4,mov,webm";
        var preset = image ? "reels_image" : "reels_video";
        var publicId = $"reels/{kind}/{userId}/{Guid.NewGuid():N}";
        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        return Ok(new ApiResponse<ArchiveUploadSignatureDto>(new ArchiveUploadSignatureDto
        {
            UploadUrl = $"https://api.cloudinary.com/v1_1/{Uri.EscapeDataString(cloudName)}/{kind}/upload",
            ApiKey = apiKey, Timestamp = timestamp, PublicId = publicId, AllowedFormats = formats,
            UploadPreset = preset, MaxBytes = (image ? 10L : 50L) * 1024 * 1024,
            Signature = CloudinaryAccount.Sign($"allowed_formats={formats}&public_id={publicId}&return_delete_token=true&timestamp={timestamp}&upload_preset={preset}", secret)
        }));
    }
}
