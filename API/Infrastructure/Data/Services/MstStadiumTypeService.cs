using API.Application.Interfaces.Services;
using TCommonUtils = CommonUtils.CommonUtils.CommonUtils;
using SharedModels.Dtos;
using SharedModels.Models;
using GuardAuth = API.Shared.Utilities.CheckAuthorized;
using System.Reflection;
using API.Application.Interfaces.Persistences;

namespace API.Infrastructure.Data.Services
{
    public class MstStadiumTypeService : IMstStadiumTypeService
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly AppDbContext _dbContext;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMstProvinceService _mstProvinceService;
        public MstStadiumTypeService(
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

        public async Task<ApiResponse<MstStadiumTypeModel>> Create(MstStadiumTypeModel data)
        {
            ApiResponse<MstStadiumTypeModel> apiResponse = new ApiResponse<MstStadiumTypeModel>();

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

            if (TCommonUtils.IsNullOrEmpty(data.StadiumTypeCode))
            {
                apiResponse.CatchException(false, "MstStadiumType_Create.StadiumTypeCodeIsNotValid", requestClient);
                return apiResponse;
            }

            //MstStadiumTypeModel _data = new MstStadiumTypeModel();
            var (isExistRecord, _data) = await _unitOfWork.MstDistrictRespository
                                            .CheckRecordExist<MstStadiumTypeModel>(
                                                                x => x.StadiumTypeCode == data.StadiumTypeCode
                                                            );


            if (isExistRecord == true)
            {
                apiResponse.CatchException(false, "MstStadiumType_Create.StadiumTypeHasAlreadyExists", requestClient);
                return apiResponse;
            }

            if (TCommonUtils.IsNullOrEmpty(data.StadiumTypeName))
            {
                apiResponse.CatchException(false, "MstStadiumType_Create.StadiumTypeNameIsNotValid", requestClient);
                return apiResponse;
            }

            decimal stadiumTypeSalePercent;
            if (!TCommonUtils.IsDecimalType(data.StadiumTypeSalePercent))
            {
                apiResponse.CatchException(false, "MstStadiumType_Create.StadiumTypeSalePercentValueIsNotValid", requestClient);
                return apiResponse;
            }
            else
            {
                decimal _point = TCommonUtils.ConvertToDecimal(data.StadiumTypeSalePercent);
                stadiumTypeSalePercent = _point;
            }

            if (data.FlagActive == false)
            {
                data.FlagActive = true;
            }
            data.CreatedDTime = TCommonUtils.DTimeNow();
            data.UpdatedDTime = TCommonUtils.DTimeNow();

            await _unitOfWork.MstStadiumTypeRespository.Create(data);
            await _dbContext.SaveChangesAsync();

            apiResponse.Data = data;

            return apiResponse;
        }

        public Task<ApiResponse<MstStadiumTypeModel>> Delete(string ProvinceCode)
        {
            throw new NotImplementedException();
        }

        public Task<ApiResponse<MstStadiumTypeModel>> Detail(string key)
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

        public async Task<ApiResponse<MstStadiumTypeModel>> GetAllActive()
        {
            ApiResponse<MstStadiumTypeModel> apiResponse = new ApiResponse<MstStadiumTypeModel>();
            List<RequestClient> requestClient = new List<RequestClient>();

            // Check Permission
            string token = _httpContextAccessor.HttpContext.Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
            bool isAuthorized = GuardAuth.IsAuthorized(token);
            if (!isAuthorized)
            {
                apiResponse.CatchException(false, "GuardAuth.401_Unauthorized", requestClient);
                return apiResponse;
            }

            List<MstStadiumTypeModel> data = await _unitOfWork.MstStadiumTypeRespository.GetAll(x => x.FlagActive == true);

            apiResponse.DataList = data;

            return apiResponse;
        }

        public Task<ApiResponse<MstStadiumTypeModel>> ImportExcel(IFormFile file)
        {
            throw new NotImplementedException();
        }

        public Task<ApiResponse<MstStadiumTypeModel>> Search(int pageIndex, int pageSize, string keyword)
        {
            throw new NotImplementedException();
        }

        public Task<ApiResponse<MstStadiumTypeModel>> Update(MstStadiumTypeModel data)
        {
            throw new NotImplementedException();
        } 
    }
}
