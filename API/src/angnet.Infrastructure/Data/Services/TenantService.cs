using angnet.Application.Interfaces.Services;
using angnet.Domain.Dtos;
using angnet.Domain.Models;
using angnet.Infrastructure.Data.UnitOfWork;
using GuardAuth = angnet.Utility.CommonUtils.CheckAuthorized;
using angnet.Utility.CommonUtils;
using ClosedXML.Excel;
using ExcelDataReader;
using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Text;
using System.Threading.Tasks;
using TCommonUtils = angnet.Utility.CommonUtils.CommonUtils;
using System.Text.Json;

namespace angnet.Infrastructure.Data.Services
{
    public class TenantService : ITenantService
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly AppDbContext _dbContext;
        private readonly IUnitOfWork _unitOfWork;
        public TenantService(
            AppDbContext appDbContext
            , IHttpContextAccessor httpContextAccessor
            , IUnitOfWork unitOfWork)
        {
            _dbContext = appDbContext;
            _httpContextAccessor = httpContextAccessor;
            _unitOfWork = unitOfWork;
        }

        public ApiResponse<TenantModel> Search(int pageIndex, int pageSize, string keyword)
        {
            ApiResponse<TenantModel> apiResponse = new ApiResponse<TenantModel>();
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

            // 
            int _pageIndex = 0;
            int _pageSize = 10;

            if (pageIndex > 0)
            {
                _pageIndex = pageIndex;
            }

            if (pageSize > 0)
            {
                _pageSize = pageSize;
            }

            //
            (List<TenantModel> dataResult, int itemCount) = _unitOfWork.TenantRepository.Search(pageIndex, pageSize, keyword);

            PageInfo<TenantModel> pageInfo = new PageInfo<TenantModel>();
            pageInfo.PageIndex = pageIndex;
            pageInfo.PageSize = pageSize;
            pageInfo.PageCount = itemCount % pageSize == 0 ? itemCount / pageSize : itemCount / pageSize + 1;
            pageInfo.ItemCount = itemCount;
            pageInfo.DataList = dataResult.Count == 0 ? new List<TenantModel>() : dataResult;

            apiResponse.objResult = pageInfo;

            return apiResponse;
        }

        public async Task<ApiResponse<TenantModel>> Create(TenantModel data)
        {
            ApiResponse<TenantModel> apiResponse = new ApiResponse<TenantModel>();

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

            if (TCommonUtils.IsNullOrEmpty(data.TenantCode))
            {
                apiResponse.CatchException(false, "Tenant_Create.TenantCodeIsNotValid", requestClient);
                return apiResponse;
            }

            if (TCommonUtils.IsNullOrEmpty(data.TenantName))
            {
                apiResponse.CatchException(false, "Tenant_Create.TenantNameIsNotValid", requestClient);
                return apiResponse;
            }

            if (TCommonUtils.IsNullOrEmpty(data.OwnedBy))
            {
                apiResponse.CatchException(false, "Tenant_Create.OwnedByIsNotValid", requestClient);
                return apiResponse;
            }

            //TenantModel _data = new TenantModel();
            var (isExistRecord, _data) = await _unitOfWork.TenantRepository
                                            .CheckRecordExist<TenantModel>(
                                                                x => x.TenantCode == data.TenantCode
                                                            );

            if (isExistRecord == true)
            {
                apiResponse.CatchException(false, "Tenant_Create.TenantHasAlreadyExists", requestClient);
                return apiResponse;
            }

            if (TCommonUtils.IsNullOrEmpty(data.TenantName))
            {
                apiResponse.CatchException(false, "Tenant_Create.TenantNameIsNotValid", requestClient);
                return apiResponse;
            }

            if (data.FlagActive == false)
            {
                data.FlagActive = true;
            }

            data.TenantStatus = Domain.Enums.ETenantStatus.Active;
            data.CreatedDTime = TCommonUtils.DTimeNow();
            data.UpdatedDTime = TCommonUtils.DTimeNow();

            await _unitOfWork.TenantRepository.Create(data);
            await _dbContext.SaveChangesAsync();

            apiResponse.Data = data;

            return apiResponse;
        }

        public async Task<ApiResponse<TenantModel>> Delete(string tenantCode)
        {
            ApiResponse<TenantModel> apiResponse = new ApiResponse<TenantModel>();
            List<RequestClient> requestClient = new List<RequestClient>();
            TCommonUtils.GetKeyValuePairRequestClient(tenantCode, ref requestClient);

            // Check Permission
            string token = _httpContextAccessor.HttpContext.Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
            bool isAuthorized = GuardAuth.IsAuthorized(token);
            if (!isAuthorized)
            {
                apiResponse.CatchException(false, "GuardAuth.401_Unauthorized", requestClient);
                return apiResponse;
            }

            if (TCommonUtils.IsNullOrEmpty(tenantCode))
            {
                apiResponse.CatchException(false, "Tenant_Delete.TenantCodeIsNotEmpty", requestClient);
                return apiResponse;
            }

            //TenantModel _data = new TenantModel();
            var (isExistRecord, _data) = await _unitOfWork.MstDistrictRespository
                                            .CheckRecordExist<TenantModel>(
                                                                x => x.TenantCode == tenantCode
                                                            );

            if (isExistRecord == false)
            {
                apiResponse.CatchException(false, "Tenant_Delete.TenantNotExistInSystem", requestClient);
                return apiResponse;
            }

            //int countRowEffected = await _dbContext.MstTenants.Where(p => p.TenantCode == TenantCode).ExecuteDeleteAsync();

            await _unitOfWork.TenantRepository.Delete(tenantCode);
            await _dbContext.SaveChangesAsync();

            //if (countRowEffected == 0)
            //{
            //    apiResponse.CatchException(false, "Tenant_Delete.SomethingWentWrongWithSystem", requestClient);
            //    return apiResponse;
            //}

            return apiResponse;
        }

        public async Task<ApiResponse<TenantModel>> Detail(string key)
        {
            ApiResponse<TenantModel> apiResponse = new ApiResponse<TenantModel>();
            List<RequestClient> requestClient = new List<RequestClient>();
            TCommonUtils.GetKeyValuePairRequestClient(key, ref requestClient);

            // Check Permission
            string token = _httpContextAccessor.HttpContext.Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
            bool isAuthorized = GuardAuth.IsAuthorized(token);
            if (!isAuthorized)
            {
                apiResponse.CatchException(false, "GuardAuth.401_Unauthorized", requestClient);
                return apiResponse;
            }

            //
            //TenantModel _data = new TenantModel();
            var (isExistRecord, _data) = await _unitOfWork.MstDistrictRespository
                                .CheckRecordExist<TenantModel>(
                                                    x => x.TenantCode == key
                                                );

            if (isExistRecord == false)
            {
                apiResponse.CatchException(false, "Tenant_Detail.TenantIsNotExists", requestClient);
                return apiResponse;
            }

            apiResponse.Data = _data;

            return apiResponse;
        }

        public async Task<ApiResponse<TenantModel>> GetAllActive()
        {
            ApiResponse<TenantModel> apiResponse = new ApiResponse<TenantModel>();
            List<RequestClient> requestClient = new List<RequestClient>();

            //// Kiểm tra Client có ngắt kết nối call api không?
            //var cancellationToken = _httpContextAccessor.HttpContext.RequestAborted; 

            // Check Permission
            string token = _httpContextAccessor.HttpContext.Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
            bool isAuthorized = GuardAuth.IsAuthorized(token);
            if (!isAuthorized)
            {
                apiResponse.CatchException(false, "GuardAuth.401_Unauthorized", requestClient);
                return apiResponse;
            }

            List<TenantModel> data = await _unitOfWork.TenantRepository.GetAll<TenantModel>(x => x.FlagActive == true
                                                                                                && x.TenantStatus == Domain.Enums.ETenantStatus.Active);

            apiResponse.DataList = data;

            return apiResponse;
        }

        public async Task<ApiResponse<TenantUpdateDto>> Update(TenantUpdateDto data)
        {
            ApiResponse<TenantUpdateDto> apiResponse = new ApiResponse<TenantUpdateDto>();
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

            if (TCommonUtils.IsNullOrEmpty(data.TenantCode))
            {
                apiResponse.CatchException(false, "Tenant_Update.TenantCodeIsNotValid", requestClient);
                return apiResponse;
            }

            //TenantModel _data = new TenantModel();
            var (isExistRecord, _data) = await _unitOfWork.TenantRepository
                                .CheckRecordExist<TenantUpdateDto>(
                                                    x => x.TenantCode == data.TenantCode
            );

            if (isExistRecord == false)
            {
                apiResponse.CatchException(false, "Tenant_Update.TenantNotExistInSystem", requestClient);
                return apiResponse;
            }

            if (TCommonUtils.IsNullOrEmpty(data.TenantName))
            {
                apiResponse.CatchException(false, "Tenant_Update.TenantNameIsNotValid", requestClient);
                return apiResponse;
            }

            TenantModel entity = new TenantModel()
            {
                TenantCode = _data.TenantCode,
                TenantName = data.TenantName,
                OwnedBy = data.OwnedBy,
                TenantPrefixHost = data.TenantPrefixHost,
                TenantHost = data.TenantHost,
                TenantConnectionString = data.TenantConnectionString,
                TenantDatabaseName = data.TenantDatabaseName,
                TenantLogo = data.TenantLogo,
                TenantDescription = data.TenantDescription,
                TenantAddress = data.TenantAddress,
                TenantStatus = data.TenantStatus,
                Remark = data.Remark,
                FlagActive = data.FlagActive,
                UpdatedBy = data.UpdatedBy,
                UpdatedDTime = TCommonUtils.DTimeNow(),
            };

            await _unitOfWork.TenantRepository.Update(entity
                                                            , x => x.TenantName
                                                            , x => x.TenantPrefixHost
                                                            , x => x.TenantHost
                                                            , x => x.TenantConnectionString
                                                            , x => x.TenantDatabaseName
                                                            , x => x.TenantLogo
                                                            , x => x.TenantDescription
                                                            , x => x.TenantAddress
                                                            , x => x.TenantStatus
                                                            , x => x.Remark
                                                            , x => x.FlagActive
                                                            , x => x.UpdatedBy
                                                            , x => x.UpdatedDTime
                                                            );
            await _dbContext.SaveChangesAsync();

            return apiResponse;
        }
    }
}
