using SharedModels.Dtos;
using SharedModels.Models;

namespace API.Application.Interfaces.Services
{
    public interface IAuditTrailService
    {
        public Task<ApiResponse<AuditTrailModel>> Create(AuditTrailModel data);
    }
}
