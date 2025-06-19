using API.Application.Interfaces.Services;
using TCommonUtils = CommonUtils.CommonUtils.CommonUtils;
using SharedModels.Dtos;
using SharedModels.Models;
using GuardAuth = API.Shared.Utilities.CheckAuthorized;
using System.Reflection;
using API.Application.Interfaces.Persistences;
using System.Linq.Expressions;

namespace API.Infrastructure.Data.Services
{
    public class NewsCategoryService : INewsCategoryService
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly AppDbContext _dbContext;
        private readonly IUnitOfWork _unitOfWork;
        public NewsCategoryService(
                AppDbContext appDbContext
                , IHttpContextAccessor httpContextAccessor
                , IUnitOfWork unitOfWork
            )
        {
            _dbContext = appDbContext;
            _httpContextAccessor = httpContextAccessor;
            _unitOfWork = unitOfWork;
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

            if (TCommonUtils.IsNullOrEmpty(data.NewsCategoryParentId))
            {
                apiResponse.CatchException(false, "NewsCategory_Create.NewsCategoryParentIdIsNotValid", requestClient);
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

            return apiResponse;
        }

        public async Task<ApiResponse<NewsCategoryDto>> GetAllActive()
        {
            ApiResponse<NewsCategoryDto> apiResponse = new ApiResponse<NewsCategoryDto>();
            List<RequestClient> requestClient = new List<RequestClient>();

            // Check Permission
            string token = _httpContextAccessor.HttpContext.Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
            bool isAuthorized = GuardAuth.IsAuthorized(token);
            if (!isAuthorized)
            {
                apiResponse.CatchException(false, "GuardAuth.401_Unauthorized", requestClient);
                return apiResponse;
            }

            // ------------
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
    }
}
