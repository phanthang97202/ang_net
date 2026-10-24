using angnet.Domain.Dtos;
using angnet.Infrastructure.Data.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace angnet.WebApi.Controllers;

[ApiController]
[Route("api/EzCloudImport")]
[Authorize]
[EnableRateLimiting("API")]
public class EzCloudImportController(
    IEzCloudImportService service, IAuthorizationService authorization, ILogger<EzCloudImportController> logger)
    : ControllerBase
{
    [HttpPost("ShiftTransactions")]
    [Authorize(Policy = "shiftreport.view")]
    public async Task<ActionResult<EzCloudImportResultDto>> ImportShiftTransactions(
        [FromBody] EzCloudImportRequestDto request, CancellationToken cancellationToken)
    {
        // Kết quả chỉ dùng để điền form tạo/sửa báo cáo, khớp nút trên giao diện.
        if (!(await authorization.AuthorizeAsync(User, "shiftreport.create")).Succeeded
            && !(await authorization.AuthorizeAsync(User, "shiftreport.update")).Succeeded)
            return Forbid();

        try
        {
            return Ok(await service.ImportShiftTransactionsAsync(request, cancellationToken));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { Code = "InvalidRequest", Message = ex.Message });
        }
        catch (EzCloudImportException ex) when (ex.Error == EzCloudImportError.InvalidToken)
        {
            return UnprocessableEntity(new { Code = "EzCloudTokenInvalid", Message = ex.Message });
        }
        catch (EzCloudImportException ex) when (ex.Error == EzCloudImportError.RateLimited)
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable,
                new { Code = "EzCloudRateLimited", Message = ex.Message });
        }
        catch (EzCloudImportException ex)
        {
            logger.LogWarning("ezCloud import failed: {Error}", ex.Error);
            return StatusCode(StatusCodes.Status502BadGateway,
                new { Code = "EzCloudUnavailable", Message = ex.Message });
        }
        catch (OperationCanceledException) when (HttpContext.RequestAborted.IsCancellationRequested)
        {
            return StatusCode(499);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Unexpected ezCloud import error");
            return StatusCode(StatusCodes.Status502BadGateway,
                new { Code = "EzCloudUnavailable", Message = "Không thể nhập dữ liệu từ ezCloud lúc này." });
        }
    }
}
