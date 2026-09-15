using angnet.Domain.Dtos;
using angnet.Domain.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using angnet.Infrastructure.Data.Services;
using angnet.Application.Interfaces.Services;
using Microsoft.AspNetCore.RateLimiting;

namespace angnet.WebApi.Controllers
{
    // Cấp controller giữ [Authorize] làm lớp đáy: thêm endpoint mới mà quên gắn
    // policy thì ít nhất vẫn phải đăng nhập, chứ không hở hẳn ra ngoài.
    // Từng endpoint đọc nhật ký thì đòi thêm quyền "audittrail.view".
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class AuditTrailController : Controller
    {
        // (Separation of Concerns - SoC) → Controller chỉ nên điều phối yêu cầu,
        // còn Service xử lý logic, Repository thao tác dữ liệu.
        private readonly IAuditTrailService _AuditTrailService;
        public AuditTrailController(IAuditTrailService AuditTrailService)
        {
            _AuditTrailService = AuditTrailService;
        }

        [Authorize(Policy = "audittrail.view")]
        [EnableRateLimitingAttribute("API")]
        [HttpGet("GetAllActive")]
        public async Task<ActionResult<AuditTrailModel>> GetAllActive()
        {
            try
            {
                ApiResponse<AuditTrailModel> response = await _AuditTrailService.GetAllActive();
                return Ok(response);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [Authorize(Policy = "audittrail.view")]
        [EnableRateLimitingAttribute("API")]
        [HttpGet("Search")]
        public ActionResult<AuditTrailModel> Search(int pageIndex, int pageSize, string keyword, string level, string trailType)
        {
            try
            {
                ApiResponse<AuditTrailModel> response = _AuditTrailService.Search(pageIndex, pageSize, keyword, level, trailType);
                return Ok(response);
            }
            catch (Exception)
            {
                throw;
            }
        }
    }
}
