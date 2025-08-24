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
