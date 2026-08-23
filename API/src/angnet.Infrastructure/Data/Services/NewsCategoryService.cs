using angnet.Application.Interfaces.Services;
using TCommonUtils = angnet.Utility.CommonUtils.CommonUtils;
using angnet.Domain.Dtos;
using angnet.Domain.Models;
using GuardAuth = angnet.Utility.CommonUtils.CheckAuthorized;
using System.Reflection;
using angnet.Application.Interfaces.Persistences;
using System.Linq.Expressions;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using DocumentFormat.OpenXml.Spreadsheet;
using angnet.Infrastructure.Data.UnitOfWork;
using Microsoft.EntityFrameworkCore;

namespace angnet.Infrastructure.Data.Services
{
    public class NewsCategoryService : INewsCategoryService
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly AppDbContext _dbContext;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IAuditTrailService _auditTrailService;

        public NewsCategoryService(
                AppDbContext appDbContext
                , IHttpContextAccessor httpContextAccessor
                , IUnitOfWork unitOfWork
                , IAuditTrailService auditTrailService 
            )
        {
            _dbContext = appDbContext;
            _httpContextAccessor = httpContextAccessor;
            _unitOfWork = unitOfWork;
            _auditTrailService = auditTrailService;
        }

        public async Task<ApiResponse<NewsCategoryModel>> Create(NewsCategoryModel data)
        {
            ApiResponse<NewsCategoryModel> apiResponse = new ApiResponse<NewsCategoryModel>();

            List<RequestClient> requestClient = new List<RequestClient>();
            TCommonUtils.GetKeyValuePairRequestClient(data, ref requestClient);

            PropertyInfo[] properties = data.GetType().GetProperties();
            foreach (PropertyInfo p in properties)
            {
                string key = p.Name;
                object value = p.GetValue(data);
                RequestClient rc = new RequestClient(key, value);
                requestClient.Add(rc);
            }

            // Check Permission
            string token = _httpContextAccessor.HttpContext.Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
            bool isAuthorized = GuardAuth.IsAuthorized(token);
            if (!isAuthorized)
            {
                apiResponse.CatchException(false, "GuardAuth.401_Unauthorized", requestClient);
                return apiResponse;
            }

            if (TCommonUtils.IsNullOrEmpty(data.NewsCategoryId))
            {
                apiResponse.CatchException(false, "NewsCategory_Create.NewsCategoryIdIsNotValid", requestClient);
                return apiResponse;
            }

            var (isExistRecordNewsCate, _dataNewsCate) = await _unitOfWork.NewsCategoryRespository
                                            .CheckRecordExist<NewsCategoryModel>(
                                                                x => x.NewsCategoryId == data.NewsCategoryId
                                                            );

            if (isExistRecordNewsCate == true)
            {
                apiResponse.CatchException(false, "NewsCategory_Create.NewsCategoryIdExisted", requestClient);
                return apiResponse;
            }

            var (isExistRecord, _data) = await _unitOfWork.NewsCategoryRespository
                                            .CheckRecordExist<NewsCategoryModel>(
                                                                x => x.NewsCategoryId == data.NewsCategoryParentId
                                                            );

            if (TCommonUtils.IsNullOrEmpty(data.NewsCategoryParentId) == false && isExistRecord == false)
            {
                apiResponse.CatchException(false, "NewsCategory_Create.NewsCategoryParentIdNotExist", requestClient);
                return apiResponse;
            }

            if (TCommonUtils.IsNullOrEmpty(data.NewsCategoryName))
            {
                apiResponse.CatchException(false, "NewsCategory_Create.NewsCategoryNameIsNotValid", requestClient);
                return apiResponse;
            }
            
            if (data.NewsCategoryIndex < 0)
            {
                apiResponse.CatchException(false, "NewsCategory_Create.NewsCategoryIndexIsNotValid", requestClient);
                return apiResponse;
            }
             
            data.FlagActive = true; 
            data.CreatedDTime = TCommonUtils.DTimeNow();
            data.UpdatedDTime = TCommonUtils.DTimeNow();

            await _unitOfWork.NewsCategoryRespository.Create(data);
            await _dbContext.SaveChangesAsync();

            apiResponse.Data = data;
            
            // save logging
            await _auditTrailService.Create(new AuditTrailDto
            {
                RecordId = data.NewsCategoryId,
                OldValues = "",
                ChangedColumns = "",
                Description = $"{data.NewsCategoryName} has created successfully!"
            });


            return apiResponse;
        }

        public async Task<ApiResponse<NewsCategoryDto>> GetAllActive()
        {
            ApiResponse<NewsCategoryDto> apiResponse = new ApiResponse<NewsCategoryDto>();

            // Danh mục là dữ liệu công khai (dùng ở thanh chọn chủ đề ngoài trang chủ),
            // khách chưa đăng nhập cũng phải xem được nên không kiểm tra token ở đây.

            Expression<Func<NewsCategoryModel, bool>> predicated = x => x.FlagActive == true;
            Expression<Func<NewsCategoryModel, NewsCategoryDto>> selectedField = s => new NewsCategoryDto
            {
                NewsCategoryId = s.NewsCategoryId,
                NewsCategoryParentId = s.NewsCategoryParentId,
                NewsCategoryName = s.NewsCategoryName,
                NewsCategoryIndex = s.NewsCategoryIndex
            };

            List<NewsCategoryDto> data = await _unitOfWork.NewsCategoryRespository.GetAll(predicated, selectedField);
             
            apiResponse.DataList = data;

            return apiResponse;
        }

        public ApiResponse<NewsCategoryModel> Search(int pageIndex, int pageSize, string keyword)
        {
            ApiResponse<NewsCategoryModel> apiResponse = new ApiResponse<NewsCategoryModel>();
            List<RequestClient> requestClient = new List<RequestClient>();
            TCommonUtils.GetKeyValuePairRequestClient(new
            {
                pageIndex,
                pageSize,
                keyword
            }, ref requestClient);

            // Check Permission
            string token = _httpContextAccessor.HttpContext.Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
            bool isAuthorized = GuardAuth.IsAuthorized(token);
            if (!isAuthorized)
            {
                apiResponse.CatchException(false, "GuardAuth.401_Unauthorized", requestClient);
                return apiResponse;
            }

            int _pageIndex = pageIndex > 0 ? pageIndex : 0;
            int _pageSize = pageSize > 0 ? pageSize : 10;

            (List<NewsCategoryModel> dataResult, int itemCount) = _unitOfWork.NewsCategoryRespository.Search(_pageIndex, _pageSize, keyword);

            PageInfo<NewsCategoryModel> pageInfo = new PageInfo<NewsCategoryModel>();
            pageInfo.PageIndex = _pageIndex;
            pageInfo.PageSize = _pageSize;
            pageInfo.PageCount = itemCount % _pageSize == 0 ? itemCount / _pageSize : itemCount / _pageSize + 1;
            pageInfo.ItemCount = itemCount;
            pageInfo.DataList = dataResult.Count == 0 ? new List<NewsCategoryModel>() : dataResult;

            apiResponse.objResult = pageInfo;

            return apiResponse;
        }

        public async Task<ApiResponse<NewsCategoryModel>> Detail(string newsCategoryId)
        {
            ApiResponse<NewsCategoryModel> apiResponse = new ApiResponse<NewsCategoryModel>();
            List<RequestClient> requestClient = new List<RequestClient>();
            TCommonUtils.GetKeyValuePairRequestClient(newsCategoryId, ref requestClient);

            // Check Permission
            string token = _httpContextAccessor.HttpContext.Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
            bool isAuthorized = GuardAuth.IsAuthorized(token);
            if (!isAuthorized)
            {
                apiResponse.CatchException(false, "GuardAuth.401_Unauthorized", requestClient);
                return apiResponse;
            }

            if (TCommonUtils.IsNullOrEmpty(newsCategoryId))
            {
                apiResponse.CatchException(false, "NewsCategory_Detail.NewsCategoryIdIsNotValid", requestClient);
                return apiResponse;
            }

            var (isExistRecord, _data) = await _unitOfWork.NewsCategoryRespository
                                            .CheckRecordExist<NewsCategoryModel>(x => x.NewsCategoryId == newsCategoryId);

            if (isExistRecord == false)
            {
                apiResponse.CatchException(false, "NewsCategory_Detail.NewsCategoryNotExistInSystem", requestClient);
                return apiResponse;
            }

            apiResponse.Data = _data;

            return apiResponse;
        }

        public async Task<ApiResponse<NewsCategoryModel>> Update(NewsCategoryModel data)
        {
            ApiResponse<NewsCategoryModel> apiResponse = new ApiResponse<NewsCategoryModel>();
            List<RequestClient> requestClient = new List<RequestClient>();
            TCommonUtils.GetKeyValuePairRequestClient(data, ref requestClient);

            // Check Permission
            string token = _httpContextAccessor.HttpContext.Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
            bool isAuthorized = GuardAuth.IsAuthorized(token);
            if (!isAuthorized)
            {
                apiResponse.CatchException(false, "GuardAuth.401_Unauthorized", requestClient);
                return apiResponse;
            }

            if (TCommonUtils.IsNullOrEmpty(data.NewsCategoryId))
            {
                apiResponse.CatchException(false, "NewsCategory_Update.NewsCategoryIdIsNotValid", requestClient);
                return apiResponse;
            }

            if (TCommonUtils.IsNullOrEmpty(data.NewsCategoryName))
            {
                apiResponse.CatchException(false, "NewsCategory_Update.NewsCategoryNameIsNotValid", requestClient);
                return apiResponse;
            }

            var (isExistRecord, _data) = await _unitOfWork.NewsCategoryRespository
                                            .CheckRecordExist<NewsCategoryModel>(x => x.NewsCategoryId == data.NewsCategoryId);

            if (isExistRecord == false)
            {
                apiResponse.CatchException(false, "NewsCategory_Update.NewsCategoryNotExistInSystem", requestClient);
                return apiResponse;
            }

            NewsCategoryModel entity = new NewsCategoryModel()
            {
                NewsCategoryId = _data.NewsCategoryId,
                TenantId = _data.TenantId,
                NewsCategoryName = data.NewsCategoryName,
                NewsCategoryParentId = data.NewsCategoryParentId ?? string.Empty,
                NewsCategoryIndex = data.NewsCategoryIndex,
                IsGlobal = data.IsGlobal,
                FlagActive = data.FlagActive,
                CreatedBy = _data.CreatedBy,
                CreatedDTime = _data.CreatedDTime,
                UpdatedBy = data.UpdatedBy,
                UpdatedDTime = TCommonUtils.DTimeNow(),
            };

            await _unitOfWork.NewsCategoryRespository.Update(entity
                                    , x => x.NewsCategoryName
                                    , x => x.NewsCategoryParentId
                                    , x => x.NewsCategoryIndex
                                    , x => x.IsGlobal
                                    , x => x.FlagActive
                                    , x => x.UpdatedBy
                                    , x => x.UpdatedDTime
                                );
            await _dbContext.SaveChangesAsync();

            apiResponse.Data = entity;

            return apiResponse;
        }

        public async Task<ApiResponse<NewsCategoryModel>> Delete(string newsCategoryId)
        {
            ApiResponse<NewsCategoryModel> apiResponse = new ApiResponse<NewsCategoryModel>();
            List<RequestClient> requestClient = new List<RequestClient>();
            TCommonUtils.GetKeyValuePairRequestClient(newsCategoryId, ref requestClient);

            // Check Permission
            string token = _httpContextAccessor.HttpContext.Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
            bool isAuthorized = GuardAuth.IsAuthorized(token);
            if (!isAuthorized)
            {
                apiResponse.CatchException(false, "GuardAuth.401_Unauthorized", requestClient);
                return apiResponse;
            }

            if (TCommonUtils.IsNullOrEmpty(newsCategoryId))
            {
                apiResponse.CatchException(false, "NewsCategory_Delete.NewsCategoryIdIsNotEmpty", requestClient);
                return apiResponse;
            }

            var (isExistRecord, _data) = await _unitOfWork.NewsCategoryRespository
                                            .CheckRecordExist<NewsCategoryModel>(x => x.NewsCategoryId == newsCategoryId);

            if (isExistRecord == false)
            {
                apiResponse.CatchException(false, "NewsCategory_Delete.NewsCategoryNotExistInSystem", requestClient);
                return apiResponse;
            }

            // Chặn xoá khi còn bài viết thuộc danh mục này, tránh bài viết trỏ tới danh mục đã mất
            bool hasNews = await _dbContext.News.AnyAsync(n => n.CategoryNewsId == newsCategoryId);
            if (hasNews)
            {
                apiResponse.CatchException(false, "NewsCategory_Delete.CategoryStillHasNews", requestClient);
                return apiResponse;
            }

            // Truyền entity chứ không truyền khóa: BaseRepository.Delete gọi thẳng _dbCtx.Remove(...)
            await _unitOfWork.NewsCategoryRespository.Delete(_data);
            await _dbContext.SaveChangesAsync();

            return apiResponse;
        }
    }
}
