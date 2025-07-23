using angnet.Application.Interfaces.Services;
using TCommonUtils = angnet.Utility.CommonUtils.CommonUtils;
using angnet.Domain.Dtos;
using angnet.Domain.Models;
using GuardAuth = angnet.Utility.CommonUtils.CheckAuthorized;
using System.Reflection;
using angnet.Application.Interfaces.Persistences;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;

namespace angnet.Infrastructure.Data.Services
{
    public class MstStadiumService : IMstStadiumService
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly AppDbContext _dbContext;
        private readonly IUnitOfWork _unitOfWork;
        public MstStadiumService(
                AppDbContext appDbContext
                , IHttpContextAccessor httpContextAccessor
                , IUnitOfWork unitOfWork
            )
        {
            _dbContext = appDbContext;
            _httpContextAccessor = httpContextAccessor;
            _unitOfWork = unitOfWork;
        }

        public async Task<ApiResponse<MstStadiumModel>> Create(MstStadiumModel data)
        {
            ApiResponse<MstStadiumModel> apiResponse = new ApiResponse<MstStadiumModel>();

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

            // Check StadiumCode
            if (TCommonUtils.IsNullOrEmpty(data.StadiumCode))
            {
                apiResponse.CatchException(false, "MstStadium_Create.StadiumCodeIsNotValid", requestClient);
                return apiResponse;
            }

            var (isExistRecordStadium, _dataStadium) = await _unitOfWork.MstStadiumRespository
                                                                        .CheckRecordExist<MstStadiumModel>(
                                                                                            x => x.StadiumCode == data.StadiumCode
                                                                                        );

            if (isExistRecordStadium == true)
            {
                apiResponse.CatchException(false, "MstStadium_Create.StadiumHasAlreadyExists", requestClient);
                return apiResponse;
            }

            // Check DistrictCode
            if (TCommonUtils.IsNullOrEmpty(data.DistrictCode))
            {
                apiResponse.CatchException(false, "MstStadium_Create.DistrictCodeIsNotValid", requestClient);
                return apiResponse;
            }

            var (isExistRecordDistrict, _dataDistrict) = await _unitOfWork.MstDistrictRespository
                                                                        .CheckRecordExist<MstDistrictModel>(
                                                                                            x => x.DistrictCode == data.DistrictCode
                                                                                        );

            if (isExistRecordDistrict == false)
            {
                apiResponse.CatchException(false, "MstStadium_Create.DistrictIsNotValid", requestClient);
                return apiResponse;
            }

            // Check StadiumStatusCode
            if (TCommonUtils.IsNullOrEmpty(data.StadiumStatusCode))
            {
                apiResponse.CatchException(false, "MstStadium_Create.StadiumStatusCodeIsNotValid", requestClient);
                return apiResponse;
            }

            var (isExistRecordStadiumStatus, _dataStadiumStatus) = await _unitOfWork.MstStadiumStatusRespository
                                                                        .CheckRecordExist<MstStadiumStatusModel>(
                                                                                            x => x.StadiumStatusCode == data.StadiumStatusCode
                                                                                        );

            if (isExistRecordStadiumStatus == false)
            {
                apiResponse.CatchException(false, "MstStadium_Create.StadiumStatusIsNotValid", requestClient);
                return apiResponse;
            }

            // Check StadiumTypeCode
            if (TCommonUtils.IsNullOrEmpty(data.StadiumTypeCode))
            {
                apiResponse.CatchException(false, "MstStadium_Create.StadiumTypeCodeIsNotValid", requestClient);
                return apiResponse;
            }

            var (isExistRecordStadiumType, _dataStadiumType) = await _unitOfWork.MstStadiumTypeRespository
                                                                        .CheckRecordExist<MstStadiumTypeModel>(
                                                                                            x => x.StadiumTypeCode == data.StadiumTypeCode
                                                                                        );

            if (isExistRecordStadiumType == false)
            {
                apiResponse.CatchException(false, "MstStadium_Create.StadiumTypeIsNotValid", requestClient);
                return apiResponse;
            }

            // Check StadiumName
            if (TCommonUtils.IsNullOrEmpty(data.StadiumName))
            {
                apiResponse.CatchException(false, "MstStadium_Create.StadiumNameIsNotValid", requestClient);
                return apiResponse;
            }

            // Check StadiumAddress
            if (TCommonUtils.IsNullOrEmpty(data.StadiumAddress))
            {
                apiResponse.CatchException(false, "MstStadium_Create.StadiumAddressIsNotValid", requestClient);
                return apiResponse;
            }

            // Check StadiumPrice (decimal)
            decimal stadiumPrice;
            if (!TCommonUtils.IsDecimalType(data.StadiumPrice))
            {
                apiResponse.CatchException(false, "MstStadium_Create.StadiumPriceValueIsNotValid", requestClient);
                return apiResponse;
            }
            else
            {
                decimal _valStadiumPrice = TCommonUtils.ConvertToDecimal(data.StadiumPrice);
                if(_valStadiumPrice < decimal.Zero || _valStadiumPrice > decimal.MaxValue)
                {
                    apiResponse.CatchException(false, "MstStadium_Create.StadiumPriceValueIsNotValid", requestClient);
                    return apiResponse;
                }
                stadiumPrice = _valStadiumPrice;
            }

            // StadiumSalePercent (decimal)
            decimal stadiumSalePercent;
            if (!TCommonUtils.IsDecimalType(data.StadiumSalePercent))
            {
                apiResponse.CatchException(false, "MstStadium_Create.StadiumSalePercentValueIsNotValid", requestClient);
                return apiResponse;
            }
            else
            {
                decimal _valStadiumSalePercent = TCommonUtils.ConvertToDecimal(data.StadiumSalePercent);
                if (_valStadiumSalePercent < 0 || _valStadiumSalePercent > 100)
                {
                    apiResponse.CatchException(false, "MstStadium_Create.StadiumSalePercentValueMustBelong0-100", requestClient);
                    return apiResponse;
                }
                stadiumSalePercent = _valStadiumSalePercent;
            }

            // Force data 
            data.FlagActive = true;
            data.FlagStadiumRent = false;
            data.CreatedDTime = TCommonUtils.DTimeNow();
            data.UpdatedDTime = TCommonUtils.DTimeNow();

            await _unitOfWork.MstStadiumRespository.Create(data);
            await _dbContext.SaveChangesAsync();

            apiResponse.Data = data;

            return apiResponse;
        }

        public async Task<ApiResponse<MstStadiumModel>> GetAllActive()
        {
            ApiResponse<MstStadiumModel> apiResponse = new ApiResponse<MstStadiumModel>();
            List<RequestClient> requestClient = new List<RequestClient>();

            // Check Permission
            string token = _httpContextAccessor.HttpContext.Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
            bool isAuthorized = GuardAuth.IsAuthorized(token);
            if (!isAuthorized)
            {
                apiResponse.CatchException(false, "GuardAuth.401_Unauthorized", requestClient);
                return apiResponse;
            }

            List<MstStadiumModel> data = await _unitOfWork.MstStadiumRespository.GetAll<MstStadiumModel>(x => x.FlagActive == true);

            apiResponse.DataList = data;

            return apiResponse;
        }
    }
}
