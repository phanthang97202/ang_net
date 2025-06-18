using API.Application.Interfaces.Services;
using TCommonUtils = CommonUtils.CommonUtils.CommonUtils; 
using SharedModels.Dtos;
using SharedModels.Models;
using GuardAuth = API.Shared.Utilities.CheckAuthorized;
using System.Reflection; 
using API.Application.Interfaces.Persistences; 

namespace API.Infrastructure.Data.Services
{
    public class MstStadiumStatusService : IMstStadiumStatusService
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly AppDbContext _dbContext;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMstProvinceService _mstProvinceService;
        public MstStadiumStatusService(
                AppDbContext appDbContext
                , IHttpContextAccessor httpContextAccessor
                , IUnitOfWork unitOfWork
                , IMstProvinceService mstProvinceService
            )
        {
            _dbContext = appDbContext;
            _httpContextAccessor = httpContextAccessor;
            _unitOfWork = unitOfWork;
            _mstProvinceService = mstProvinceService;
        }

        public async Task<ApiResponse<MstStadiumStatusModel>> Create(MstStadiumStatusModel data)
        {
            ApiResponse<MstStadiumStatusModel> apiResponse = new ApiResponse<MstStadiumStatusModel>();

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

            if (TCommonUtils.IsNullOrEmpty(data.StadiumStatusCode))
            {
                apiResponse.CatchException(false, "MstStadiumStatus_Create.StadiumStatusCodeIsNotValid", requestClient);
                return apiResponse;
            }

            MstStadiumStatusModel _data = new MstStadiumStatusModel();
            bool isExistRecord = CheckRecordExist(data.StadiumStatusCode, ref _data);

            if (isExistRecord == true)
            {
                apiResponse.CatchException(false, "MstStadiumStatus_Create.StadiumStatusHasAlreadyExists", requestClient);
                return apiResponse;
            }

            if (string.IsNullOrEmpty(data.StadiumStatusName))
            {
                apiResponse.CatchException(false, "MstStadiumStatus_Create.StadiumStatusNameIsNotValid", requestClient);
                return apiResponse;
            }

            if (data.FlagActive == false)
            {
                data.FlagActive = true;
            }
            data.CreatedDTime = TCommonUtils.DTimeNow();
            data.UpdatedDTime = TCommonUtils.DTimeNow();

            await _unitOfWork.MstStadiumStatusRespository.Create(data);
            await _dbContext.SaveChangesAsync();

            apiResponse.Data = data;

            return apiResponse;
        }

        public Task<ApiResponse<MstStadiumStatusModel>> Delete(string ProvinceCode)
        {
            throw new NotImplementedException();
        }

        public Task<ApiResponse<MstStadiumStatusModel>> Detail(string key)
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

        public async Task<ApiResponse<MstStadiumStatusModel>> GetAllActive()
        {
            ApiResponse<MstStadiumStatusModel> apiResponse = new ApiResponse<MstStadiumStatusModel>();
            List<RequestClient> requestClient = new List<RequestClient>();

            // Check Permission
            string token = _httpContextAccessor.HttpContext.Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
            bool isAuthorized = GuardAuth.IsAuthorized(token);
            if (!isAuthorized)
            {
                apiResponse.CatchException(false, "GuardAuth.401_Unauthorized", requestClient);
                return apiResponse;
            }

            List<MstStadiumStatusModel> data = await _unitOfWork.MstStadiumStatusRespository.GetAll(x => x.FlagActive == true);

            apiResponse.DataList = data;

            return apiResponse;
        }

        public Task<ApiResponse<MstStadiumStatusModel>> ImportExcel(IFormFile file)
        {
            throw new NotImplementedException();
        }

        public Task<ApiResponse<MstStadiumStatusModel>> Search(int pageIndex, int pageSize, string keyword)
        {
            throw new NotImplementedException();
        }

        public Task<ApiResponse<MstStadiumStatusModel>> Update(MstStadiumStatusModel data)
        {
            throw new NotImplementedException();
        }

        public bool CheckRecordExist(string key, ref MstStadiumStatusModel data)
        {
            var record = _dbContext.MstStadiumStatuses
                .Find(key);

            if (record is not null)
            {
                data = record;
                return true;
            }

            data = null;
            return false;
        }
    }
}
