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
            //✅ MỤC TIÊU CỦA TRUY VẤN
            //Bạn muốn lấy 1 bản ghi đại diện duy nhất cho mỗi HashTagNewsName, ưu tiên bản ghi có Count cao nhất, và sau đó lấy TOP N bản ghi có Count cao nhất trong số đó.

            //🔎 GIẢ SỬ DỮ LIỆU TRONG BẢNG HashTagNews
            //HashTagNewsId   HashTagNewsName NewsId  Count CreatedDTime
            //1.NET    1001    5   2024 - 01 - 01
            //2   Angular 1002    7   2024 - 01 - 03
            //3.NET    1003    10  2024 - 01 - 05
            //4   React   1004    3   2024 - 02 - 01
            //5   Angular 1005    4   2024 - 02 - 02
            //6   React   1006    9   2024 - 02 - 10

            //🔄 BƯỚC 1: .GroupBy(x => x.HashTagNewsName)
            //Nhóm theo tên hashtag:

            //.NET → [#1, #3]
            //Angular → [#2, #5]
            //React → [#4, #6]

            //🔄 BƯỚC 2: g.OrderByDescending(x => x.Count).Select(...).First()
            //Trong mỗi nhóm, chọn bản ghi có Count cao nhất:

            //.NET → #3 (.NET - Count 10)
            //Angular → #2 (Count 7)
            //React → #6 (Count 9)

            //🔄 BƯỚC 3: .OrderByDescending(x => x.Count)
            //Sắp xếp lại 3 bản ghi trên:

            //.NET(Count 10)
            //React(Count 9)
            //Angular(Count 7)

            //🔄 BƯỚC 4: .Take(N)
            //Lấy tối đa TConstValue.MAX_TOP_HASHTAGNEWS bản ghi(ví dụ: 3).
            var grouped = await _dbContext.HashTagNews
                        .AsNoTracking()
                        .ToListAsync();

            var data = grouped
                        .GroupBy(x => x.HashTagNewsName)
                        .Select(g => g.OrderByDescending(x => x.Count).First())
                        .OrderByDescending(x => x.Count)
                        .Take(TConstValue.MAX_TOP_HASHTAGNEWS)
                        .ToList();


            apiResponse.DataList = data;

            return apiResponse;
        }
    }
}
