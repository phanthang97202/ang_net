using angnet.Domain.Dtos;
using angnet.Domain.Models;

namespace angnet.Application.Interfaces.Services
{
    public interface IAuditTrailService
    {
        public Task<ApiResponse<AuditTrailModel>> GetAllActive();
        public ApiResponse<AuditTrailModel> Search(int pageIndex, int pageSize, string keyword, string level, string trailType);
        public Task<ApiResponse<AuditTrailDto>> Create(AuditTrailDto data);
    }
}
