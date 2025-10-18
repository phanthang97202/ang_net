using angnet.Application.Interfaces.Services;
using TCommonUtils = angnet.Utility.CommonUtils.CommonUtils;
using angnet.Domain.Dtos;
using angnet.Domain.Models;
using GuardAuth = angnet.Utility.CommonUtils.CheckAuthorized;
using System.Reflection;
using Microsoft.AspNetCore.Http;
using angnet.Infrastructure.Data.UnitOfWork;

namespace angnet.Infrastructure.Data.Services
{
    public class MstDistrictService : IMstDistrictService
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly AppDbContext _dbContext;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMstProvinceService _mstProvinceService;
        public MstDistrictService(
                AppDbContext appDbContext
                , IHttpContextAccessor httpContextAccessor
                , IUnitOfWork unitOfWork
                ,IMstProvinceService mstProvinceService
            )
        {
            _dbContext = appDbContext;
            _httpContextAccessor = httpContextAccessor;
            _unitOfWork = unitOfWork;
            _mstProvinceService = mstProvinceService;
        }

        public ApiResponse<MstDistrictModel> Search(int pageIndex, int pageSize, string keyword)
        {
            ApiResponse<MstDistrictModel> apiResponse = new ApiResponse<MstDistrictModel>();
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
            (List<MstDistrictModel> dataResult, int itemCount) = _unitOfWork.MstDistrictRespository.Search(pageIndex, pageSize, keyword);

            PageInfo<MstDistrictModel> pageInfo = new PageInfo<MstDistrictModel>();
            pageInfo.PageIndex = pageIndex;
            pageInfo.PageSize = pageSize;
            pageInfo.PageCount = itemCount % pageSize == 0 ? itemCount / pageSize : itemCount / pageSize + 1;
            pageInfo.ItemCount = itemCount;
            pageInfo.DataList = dataResult.Count == 0 ? new List<MstDistrictModel>() : dataResult;

            apiResponse.objResult = pageInfo;

            return apiResponse;
        }

        public async Task<ApiResponse<MstDistrictModel>> Create(MstDistrictModel data)
        {
            ApiResponse<MstDistrictModel> apiResponse = new ApiResponse<MstDistrictModel>();

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

            if (TCommonUtils.IsNullOrEmpty(data.ProvinceCode))
            {
                apiResponse.CatchException(false, "MstDistrict_MstDistrict_Create.ProvinceCodeIsNotValid", requestClient);
                return apiResponse;
            }

            MstProvinceModel _dataProvince = new MstProvinceModel();
            ApiResponse< MstProvinceModel> rpProvinceDetail = await _mstProvinceService.Detail(data.ProvinceCode);
            if (rpProvinceDetail.Data is null)
            {
                apiResponse.CatchException(false, "MstDistrict_Create.ProvinceInvalid", requestClient);
                return apiResponse;
            }

            var (isExistRecord, _data) = await _unitOfWork.MstDistrictRespository
                                            .CheckRecordExist<MstDistrictModel>(
                                                                x => x.DistrictCode == data.DistrictCode && x.ProvinceCode == data.ProvinceCode
                                                            );

            if (isExistRecord == true)
            {
                apiResponse.CatchException(false, "MstDistrict_Create.DistrictHasAlreadyExists", requestClient);
                return apiResponse;
            }

            if (TCommonUtils.IsNullOrEmpty(data.DistrictName))
            {
                apiResponse.CatchException(false, "MstDistrict_Create.DistrictNameIsNotValid", requestClient);
                return apiResponse;
            }

            if (data.FlagActive == false)
            {
                data.FlagActive = true;
            }
            data.CreatedDTime = TCommonUtils.DTimeNow();
            data.UpdatedDTime = TCommonUtils.DTimeNow();

            await _unitOfWork.MstDistrictRespository.Create(data);
            await _dbContext.SaveChangesAsync();

            apiResponse.Data = data;

            return apiResponse;

        }  

        public Task<ApiResponse<MstDistrictModel>> Detail(string key)
        {
            throw new NotImplementedException();
        }

        public Task<ApiResponse<MstDistrictModel>> Update(MstDistrictModel data)
        {
            throw new NotImplementedException();
        }

        public Task<ApiResponse<MstDistrictModel>> Delete(string ProvinceCode)
        {
            throw new NotImplementedException();
        }

        public async Task<ApiResponse<MstDistrictModel>> GetAllActive()
        {
            ApiResponse<MstDistrictModel> apiResponse = new ApiResponse<MstDistrictModel>();
            List<RequestClient> requestClient = new List<RequestClient>();

            // Check Permission
            string token = _httpContextAccessor.HttpContext.Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
            bool isAuthorized = GuardAuth.IsAuthorized(token);
            if (!isAuthorized)
            {
                apiResponse.CatchException(false, "GuardAuth.401_Unauthorized", requestClient);
                return apiResponse;
            }

            List<MstDistrictModel> data = await _unitOfWork.MstDistrictRespository.GetAll<MstDistrictModel>(x => x.FlagActive == true);

            apiResponse.DataList = data;

            return apiResponse;
        }

        public Task<ApiResponse<MstDistrictModel>> ImportExcel(IFormFile file)
        {
            throw new NotImplementedException();
        }

        public Task<byte[]> ExportExcel()
        {
            throw new NotImplementedException();
        }

        public Task<byte[]> ExportTemplate()
        {
            throw new NotImplementedException();
        }
    }
}
