using angnet.Domain.Dtos;
using angnet.Domain.Models;
using GuardAuth = angnet.Utility.CommonUtils.CheckAuthorized;
using TConstValue = angnet.Utility.CommonUtils.ConstValue;
using Microsoft.EntityFrameworkCore;
using angnet.Application.Interfaces.Repositories;
using angnet.Infrastructure.Data;
using DocumentFormat.OpenXml.Bibliography;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;


namespace angnet.Infrastructure.Data.Repositories
{
    public class HashTagNewsRespository : IHashTagNewsRespository
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly AppDbContext _dbContext;
        public HashTagNewsRespository(AppDbContext appDbContext, IHttpContextAccessor httpContextAccessor)
        {
            _dbContext = appDbContext;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<ApiResponse<HashTagNewsModel>> GetTopHashTag()
        {
            ApiResponse<HashTagNewsModel> apiResponse = new ApiResponse<HashTagNewsModel>();
            List<RequestClient> requestClient = new List<RequestClient>();

            // Check Permission
            string token = _httpContextAccessor.HttpContext.Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
            //bool isAuthorized = GuardAuth.IsAuthorized(token);
            //if (!isAuthorized)
            //{
            //    apiResponse.CatchException(false, "GuardAuth.401_Unauthorized", requestClient);
            //    return apiResponse;
            //}

            // ========================================
            // MỤC TIÊU: lấy TOP N hashtag được dùng NHIỀU NHẤT, mỗi tên tag một bản ghi.
            //
            // Không xếp hạng bằng cột Count trong DB: NewsRespository lúc tạo tag hoặc
            // bỏ trống cột này (=> 0), hoặc gán cứng = 1, chưa bao giờ cộng dồn. Nên
            // trước đây mọi tag đều Count = 1, OrderByDescending không có gì để sắp,
            // và 6 tag hiện ra thực chất là 6 tag bất kỳ theo thứ tự DB trả về chứ
            // không phải tag nổi bật. Giờ đếm thẳng số bài viết đang dùng mỗi tag.
            //
            // Ví dụ: tag "Chè" nằm ở 3 bài, "Girl" ở 1 bài => "Chè" xếp trên.
            // Bằng điểm thì tag nào được dùng gần đây hơn sẽ đứng trước.
            //
            // Chỉ tính hashtag của bài ĐÃ XUẤT BẢN. Trước đây query không join sang
            // News nên khối "Thẻ nổi bật" hiện cả tag của bài nháp; người dùng bấm
            // vào sẽ ra danh sách rỗng vì Search đã lọc FlagActive.
            List<string> publishedNewsIds = await _dbContext.News
                        .AsNoTracking()
                        .Where(n => n.FlagActive)
                        .Select(n => n.NewsId)
                        .ToListAsync();

            var grouped = await _dbContext.HashTagNews
                        .AsNoTracking()
                        .Where(h => publishedNewsIds.Contains(h.NewsId))
                        .ToListAsync();

            var data = grouped
                        .GroupBy(x => x.HashTagNewsName)
                        .Select(g =>
                        {
                            // Lấy bản ghi mới nhất làm đại diện cho tên tag, rồi ghi
                            // số bài thật sự đang dùng tag vào Count để client cũng
                            // nhận được con số có nghĩa. Query đang AsNoTracking nên
                            // gán vào đây không đụng gì tới DB.
                            HashTagNewsModel tag = g.OrderByDescending(x => x.CreatedDTime).First();
                            tag.Count = g.Select(x => x.NewsId).Distinct().Count();
                            return tag;
                        })
                        .OrderByDescending(x => x.Count)
                        .ThenByDescending(x => x.CreatedDTime)
                        .Take(TConstValue.MAX_TOP_HASHTAGNEWS)
                        .ToList();


            apiResponse.DataList = data;

            return apiResponse;
        }
    }
}
