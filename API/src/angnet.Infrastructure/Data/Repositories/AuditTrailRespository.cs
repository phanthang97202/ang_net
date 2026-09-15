using angnet.Application.Interfaces.Repositories;
using angnet.Domain.Enums;
using angnet.Domain.Models;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using TCommonUtils = angnet.Utility.CommonUtils.CommonUtils;

namespace angnet.Infrastructure.Data.Repositories
{
    public class AuditTrailRespository : BaseRepository<AuditTrailModel>, IAuditTrailRespository
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly AppDbContext _dbContext;
        public AuditTrailRespository(AppDbContext appDbContext, IHttpContextAccessor httpContextAccessor) : base(appDbContext, httpContextAccessor)
        {
            _dbContext = appDbContext;
            _httpContextAccessor = httpContextAccessor;
        }

        /// <summary>
        /// Lọc + phân trang ngay dưới DB. Bảng nhật ký chỉ có tăng chứ không giảm,
        /// nên GetAll (tải cả bảng rồi mới sắp xếp trong bộ nhớ) sẽ ngày một chậm.
        /// </summary>
        public (List<AuditTrailModel> Data, int TotalCount) Search(
                                                                            int pageIndex
                                                                            , int pageSize
                                                                            , string keyword
                                                                            , string level
                                                                            , string trailType
        )
        {
            IQueryable<AuditTrailModel> query = _dbContext.AuditTrail.AsNoTracking();

            if (!TCommonUtils.IsNullOrEmpty(keyword))
            {
                query = query.Where(a => a.Description.Contains(keyword)
                                         || a.ChangedBy.Contains(keyword)
                                         || a.RecordId.Contains(keyword));
            }

            // Level/TrailType là enum lưu dưới dạng số, nên so khớp bằng giá trị enum
            // đã parse thay vì so chuỗi - tránh lọc trượt toàn bộ.
            if (!TCommonUtils.IsNullOrEmpty(level)
                && Enum.TryParse<EAuditTrailLevel>(level, true, out var levelValue))
            {
                query = query.Where(a => a.Level == levelValue);
            }

            if (!TCommonUtils.IsNullOrEmpty(trailType)
                && Enum.TryParse<EAuditTrailType>(trailType, true, out var trailTypeValue))
            {
                query = query.Where(a => a.TrailType == trailTypeValue);
            }

            int itemCount = query.Count();

            // Thêm AuditTrailId làm khoá phụ: nhiều bản ghi có thể trùng ChangedDTime
            // (cùng một thao tác ghi vài dòng), chỉ sắp theo thời gian thì thứ tự
            // giữa các trang không ổn định và dòng có thể nhảy qua lại.
            List<AuditTrailModel> dataResult = query.OrderByDescending(a => a.ChangedDTime)
                                                    .ThenByDescending(a => a.AuditTrailId)
                                                    .Skip(pageIndex * pageSize)
                                                    .Take(pageSize)
                                                    .ToList();

            return (dataResult, itemCount);
        }
    }
}
