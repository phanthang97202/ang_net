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
    public class SysParameterService : ISysParameterService
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly AppDbContext _dbContext;
        private readonly IUnitOfWork _unitOfWork;
        public SysParameterService(
                AppDbContext appDbContext
                , IHttpContextAccessor httpContextAccessor
                , IUnitOfWork unitOfWork
            )
        {
            _dbContext = appDbContext;
            _httpContextAccessor = httpContextAccessor;
            _unitOfWork = unitOfWork;
        }

        public ApiResponse<SysParameterModel> Search(int pageIndex, int pageSize, string keyword, string category)
        {
            ApiResponse<SysParameterModel> apiResponse = new ApiResponse<SysParameterModel>();
            List<RequestClient> requestClient = new List<RequestClient>();
            TCommonUtils.GetKeyValuePairRequestClient(new
            {
                pageIndex,
                pageSize,
                keyword,
                category
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
            (List<SysParameterModel> dataResult, int itemCount) = _unitOfWork.SysParameterRespository.Search(_pageIndex, _pageSize, keyword, category);

            PageInfo<SysParameterModel> pageInfo = new PageInfo<SysParameterModel>();
            pageInfo.PageIndex = _pageIndex;
            pageInfo.PageSize = _pageSize;
            pageInfo.PageCount = itemCount % _pageSize == 0 ? itemCount / _pageSize : itemCount / _pageSize + 1;
            pageInfo.ItemCount = itemCount;
            pageInfo.DataList = dataResult.Count == 0 ? new List<SysParameterModel>() : dataResult;

            apiResponse.objResult = pageInfo;

            return apiResponse;
        }

        public async Task<ApiResponse<SysParameterModel>> Detail(string key)
        {
            ApiResponse<SysParameterModel> apiResponse = new ApiResponse<SysParameterModel>();
            List<RequestClient> requestClient = new List<RequestClient>();
            TCommonUtils.GetKeyValuePairRequestClient(key, ref requestClient);

            // Không check GuardAuth: endpoint này để public cho web client (xem SysParameterController.Detail)

            var (isExistRecord, _data) = await _unitOfWork.SysParameterRespository
                                .CheckRecordExist<SysParameterModel>(
                                                    x => x.ParameterCode == key
                                                );

            if (isExistRecord == false)
            {
                apiResponse.CatchException(false, "SysParameter_Detail.ParameterIsNotExists", requestClient);
                return apiResponse;
            }

            apiResponse.Data = _data;

            return apiResponse;
        }

        public async Task<ApiResponse<SysParameterModel>> Create(SysParameterModel data)
        {
            ApiResponse<SysParameterModel> apiResponse = new ApiResponse<SysParameterModel>();

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

            if (TCommonUtils.IsNullOrEmpty(data.ParameterCode))
            {
                apiResponse.CatchException(false, "SysParameter_Create.ParameterCodeIsNotValid", requestClient);
                return apiResponse;
            }

            var (isExistRecord, _data) = await _unitOfWork.SysParameterRespository
                                            .CheckRecordExist<SysParameterModel>(
                                                                x => x.ParameterCode == data.ParameterCode
                                                            );

            if (isExistRecord == true)
            {
                apiResponse.CatchException(false, "SysParameter_Create.ParameterHasAlreadyExists", requestClient);
                return apiResponse;
            }

            if (TCommonUtils.IsNullOrEmpty(data.ParameterNameVi))
            {
                apiResponse.CatchException(false, "SysParameter_Create.ParameterNameViIsNotValid", requestClient);
                return apiResponse;
            }

            if (TCommonUtils.IsNullOrEmpty(data.ParameterNameEn))
            {
                apiResponse.CatchException(false, "SysParameter_Create.ParameterNameEnIsNotValid", requestClient);
                return apiResponse;
            }

            if (TCommonUtils.IsNullOrEmpty(data.DataType))
            {
                apiResponse.CatchException(false, "SysParameter_Create.DataTypeIsNotValid", requestClient);
                return apiResponse;
            }

            if (TCommonUtils.IsNullOrEmpty(data.Category))
            {
                apiResponse.CatchException(false, "SysParameter_Create.CategoryIsNotValid", requestClient);
                return apiResponse;
            }

            if (data.FlagActive == false)
            {
                data.FlagActive = true;
            }
            data.CreatedDTime = TCommonUtils.DTimeNow();
            data.UpdatedDTime = TCommonUtils.DTimeNow();

            await _unitOfWork.SysParameterRespository.Create(data);
            await _dbContext.SaveChangesAsync();

            apiResponse.Data = data;

            return apiResponse;
        }

        public async Task<ApiResponse<SysParameterModel>> Update(SysParameterModel data)
        {
            ApiResponse<SysParameterModel> apiResponse = new ApiResponse<SysParameterModel>();
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

            if (TCommonUtils.IsNullOrEmpty(data.ParameterCode))
            {
                apiResponse.CatchException(false, "SysParameter_Update.ParameterCodeIsNotValid", requestClient);
                return apiResponse;
            }

            var (isExistRecord, _data) = await _unitOfWork.SysParameterRespository
                                .CheckRecordExist<SysParameterModel>(
                                                    x => x.ParameterCode == data.ParameterCode
                                                );

            if (isExistRecord == false)
            {
                apiResponse.CatchException(false, "SysParameter_Update.ParameterNotExistInSystem", requestClient);
                return apiResponse;
            }

            if (TCommonUtils.IsNullOrEmpty(data.ParameterNameVi))
            {
                apiResponse.CatchException(false, "SysParameter_Update.ParameterNameViIsNotValid", requestClient);
                return apiResponse;
            }

            if (TCommonUtils.IsNullOrEmpty(data.ParameterNameEn))
            {
                apiResponse.CatchException(false, "SysParameter_Update.ParameterNameEnIsNotValid", requestClient);
                return apiResponse;
            }

            if (TCommonUtils.IsNullOrEmpty(data.DataType))
            {
                apiResponse.CatchException(false, "SysParameter_Update.DataTypeIsNotValid", requestClient);
                return apiResponse;
            }

            if (TCommonUtils.IsNullOrEmpty(data.Category))
            {
                apiResponse.CatchException(false, "SysParameter_Update.CategoryIsNotValid", requestClient);
                return apiResponse;
            }

            SysParameterModel entity = new SysParameterModel()
            {
                ParameterCode = _data.ParameterCode,
                ParameterNameVi = data.ParameterNameVi,
                ParameterNameEn = data.ParameterNameEn,
                ParameterValueVi = data.ParameterValueVi,
                ParameterValueEn = data.ParameterValueEn,
                DefaultValueVi = data.DefaultValueVi,
                DefaultValueEn = data.DefaultValueEn,
                DataType = data.DataType,
                Category = data.Category,
                DescriptionVi = data.DescriptionVi,
                DescriptionEn = data.DescriptionEn,
                SortOrder = data.SortOrder,
                FlagActive = data.FlagActive,
                CreatedBy = _data.CreatedBy,
                UpdatedBy = data.UpdatedBy,
                CreatedDTime = _data.CreatedDTime,
                UpdatedDTime = TCommonUtils.DTimeNow(),
            };

            await _unitOfWork.SysParameterRespository.Update(entity
                                                            , x => x.ParameterNameVi
                                                            , x => x.ParameterNameEn
                                                            , x => x.ParameterValueVi
                                                            , x => x.ParameterValueEn
                                                            , x => x.DefaultValueVi
                                                            , x => x.DefaultValueEn
                                                            , x => x.DataType
                                                            , x => x.Category
                                                            , x => x.DescriptionVi
                                                            , x => x.DescriptionEn
                                                            , x => x.SortOrder
                                                            , x => x.FlagActive
                                                            , x => x.UpdatedBy
                                                            , x => x.UpdatedDTime
                                                            );
            await _dbContext.SaveChangesAsync();

            return apiResponse;
        }

        public async Task<ApiResponse<SysParameterModel>> Delete(string ParameterCode)
        {
            ApiResponse<SysParameterModel> apiResponse = new ApiResponse<SysParameterModel>();
            List<RequestClient> requestClient = new List<RequestClient>();
            TCommonUtils.GetKeyValuePairRequestClient(ParameterCode, ref requestClient);

            // Check Permission
            string token = _httpContextAccessor.HttpContext.Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
            bool isAuthorized = GuardAuth.IsAuthorized(token);
            if (!isAuthorized)
            {
                apiResponse.CatchException(false, "GuardAuth.401_Unauthorized", requestClient);
                return apiResponse;
            }

            if (TCommonUtils.IsNullOrEmpty(ParameterCode))
            {
                apiResponse.CatchException(false, "SysParameter_Delete.ParameterCodeIsNotEmpty", requestClient);
                return apiResponse;
            }

            var (isExistRecord, _data) = await _unitOfWork.SysParameterRespository
                                            .CheckRecordExist<SysParameterModel>(
                                                                x => x.ParameterCode == ParameterCode
                                                            );

            if (isExistRecord == false)
            {
                apiResponse.CatchException(false, "SysParameter_Delete.ParameterNotExistInSystem", requestClient);
                return apiResponse;
            }

            // Truyền entity chứ không truyền khóa: BaseRepository.Delete gọi thẳng _dbCtx.Remove(...)
            await _unitOfWork.SysParameterRespository.Delete(_data);
            await _dbContext.SaveChangesAsync();

            return apiResponse;
        }

        public async Task<ApiResponse<SysParameterModel>> GetAllActive()
        {
            ApiResponse<SysParameterModel> apiResponse = new ApiResponse<SysParameterModel>();
            List<RequestClient> requestClient = new List<RequestClient>();

            // Check Permission
            string token = _httpContextAccessor.HttpContext.Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
            bool isAuthorized = GuardAuth.IsAuthorized(token);
            if (!isAuthorized)
            {
                apiResponse.CatchException(false, "GuardAuth.401_Unauthorized", requestClient);
                return apiResponse;
            }

            List<SysParameterModel> data = await _unitOfWork.SysParameterRespository.GetAll<SysParameterModel>(x => x.FlagActive == true);

            apiResponse.DataList = data;

            return apiResponse;
        }
    }
}
