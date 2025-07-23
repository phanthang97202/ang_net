using angnet.Domain.Dtos;
using angnet.Domain.Models;

namespace angnet.Application.Interfaces.Services
{
    public interface IAuditTrailService
    {
        public Task<ApiResponse<AuditTrailModel>> GetAllActive();
        public Task<ApiResponse<AuditTrailDto>> Create(AuditTrailDto data);
    }
}
