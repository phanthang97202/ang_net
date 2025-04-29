using API.Data;
using API.Interfaces;
using API.IRespositories;
using ClosedXML.Excel;
using ExcelDataReader;
using Microsoft.EntityFrameworkCore;
using SharedModels.Dtos;
using SharedModels.Models;
using System.Data;
using System.Reflection;
using System.Text.Json;
using GuardAuth = API.Middlewares.CheckAuthorized;
using TCommonUtils = CommonUtils.CommonUtils.CommonUtils;

namespace API.Respositories
{
    public class MstDistrictRespository : IMstDistrictRespository
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly AppDbContext _dbContext;
        public MstDistrictRespository(AppDbContext appDbContext, IHttpContextAccessor httpContextAccessor)
        {
            _dbContext = appDbContext;
            _httpContextAccessor = httpContextAccessor;
        }

        public bool CheckRecordExist(string key, ref MstDistrictModel data)
        {
            MstDistrictModel record = _dbContext.MstDistricts.Find(key);
            if (record is not null)
            {
                data = record;
                return true;
            }
            data = null;
            return false;
        }

        public bool CheckRecordProvinceExist(string key, ref MstProvinceModel data)
        {
            MstProvinceModel record = _dbContext.MstProvinces.Find(key);
            if (record is not null)
            {
                data = record;
                return true;
            }
            data = null;
            return false;
        }

        public async Task<ApiResponse<MstDistrictModel>> Search(int pageIndex, int pageSize, string keyword)
        {
            ApiResponse<MstDistrictModel> apiResponse = new ApiResponse<MstDistrictModel>();
            List<RequestClient> requestClient = new List<RequestClient>();
            TCommonUtils.GetKeyValuePairRequestClient(new
            {
                pageIndex = pageIndex,
                pageSize = pageSize,
                keyword = keyword
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
            List<MstDistrictModel> dataResult = new List<MstDistrictModel>();

            IQueryable<MstDistrictModel> query = _dbContext.MstDistricts
                                    .Where(p => !TCommonUtils.IsNullOrEmpty(keyword) ? p.DistrictName.Contains(keyword) || p.DistrictCode == keyword : true);

            int itemCount = query.ToList().Count;

            dataResult = query.Skip(_pageIndex * _pageSize)
                             .Take(_pageSize)
                             .ToList();

            PageInfo<MstDistrictModel> pageInfo = new PageInfo<MstDistrictModel>();
            pageInfo.PageIndex = pageIndex;
            pageInfo.PageSize = pageSize;
            pageInfo.PageCount = itemCount % pageSize == 0 ? itemCount / pageSize : itemCount / pageSize + 1;
            pageInfo.ItemCount = itemCount;
            pageInfo.DataList = dataResult.Count == 0 ? new List<MstDistrictModel>() : dataResult;

            apiResponse.objResult = pageInfo;

            return apiResponse;
        }

        public async Task<ApiResponse<MstDistrictModel>> Detail(string key)
        {
            ApiResponse<MstDistrictModel> apiResponse = new ApiResponse<MstDistrictModel>();
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
            MstDistrictModel _data = new MstDistrictModel();
            bool isExistRecord = CheckRecordExist(key, ref _data);

            if (isExistRecord == false)
            {
                apiResponse.CatchException(false, "MstDistrict_Detail.DistrictIsNotExists", requestClient);
                return apiResponse;
            }

            apiResponse.Data = _data;

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

            if (TCommonUtils.IsNullOrEmpty((data.DistrictCode)))
            {
                apiResponse.CatchException(false, "MstDistrict_Create.DistrictCodeIsNotValid", requestClient);
                return apiResponse;
            }

            MstDistrictModel _data = new MstDistrictModel();
            bool isExistRecord = CheckRecordExist(data.DistrictCode, ref _data);

            MstProvinceModel _dataProvince = new MstProvinceModel();
            bool isExistRecordProvince = CheckRecordProvinceExist(data.ProvinceCode, ref _dataProvince);

            if (isExistRecord == true)
            {
                apiResponse.CatchException(false, "MstDistrict_Create.DistrictHasAlreadyExists", requestClient);
                return apiResponse;
            }

            if (isExistRecordProvince == false)
            {
                apiResponse.CatchException(false, "MstDistrict_Create.ProvinceHasNotAlreadyExists", requestClient);
                return apiResponse;
            }

            if (string.IsNullOrEmpty(data.DistrictName))
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

            await _dbContext.MstDistricts.AddAsync(data);
            //await _dbContext.SaveChangesAsync(); // chuyển => Dùng UoW

            apiResponse.Data = data;

            return apiResponse;
        }

        public async Task<ApiResponse<MstDistrictModel>> Update(MstDistrictModel data)
        {
            ApiResponse<MstDistrictModel> apiResponse = new ApiResponse<MstDistrictModel>();
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

            if (TCommonUtils.IsNullOrEmpty(data.DistrictCode))
            {
                apiResponse.CatchException(false, "MstDistrict_Update.DistrictCodeIsNotValid", requestClient);
                return apiResponse;
            }

            MstDistrictModel? _data = new MstDistrictModel();
            bool isExistRecord = CheckRecordExist(data.DistrictCode, ref _data);

            if (isExistRecord == false)
            {
                apiResponse.CatchException(false, "MstDistrict_Update.DistrictNotExistInSystem", requestClient);
                return apiResponse;
            }

            if (string.IsNullOrEmpty(data.DistrictName))
            {
                apiResponse.CatchException(false, "MstDistrict_Update.DistrictNameIsNotValid", requestClient);
                return apiResponse;
            }

            await _dbContext.MstDistricts.Where(p => p.DistrictCode == data.DistrictCode)
                .ExecuteUpdateAsync(setter =>
                      setter.SetProperty(p => p.DistrictName, data.DistrictName)
                            .SetProperty(p => p.FlagActive, data.FlagActive)
                            .SetProperty(p => p.UpdatedDTime, TCommonUtils.DTimeNow())
                );
            //await _dbContext.SaveChangesAsync();

            return apiResponse;
        }

        public async Task<ApiResponse<MstDistrictModel>> Delete(string DistrictCode)
        {
            ApiResponse<MstDistrictModel> apiResponse = new ApiResponse<MstDistrictModel>();
            List<RequestClient> requestClient = new List<RequestClient>();
            TCommonUtils.GetKeyValuePairRequestClient(DistrictCode, ref requestClient);

            // Check Permission
            string token = _httpContextAccessor.HttpContext.Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
            bool isAuthorized = GuardAuth.IsAuthorized(token);
            if (!isAuthorized)
            {
                apiResponse.CatchException(false, "GuardAuth.401_Unauthorized", requestClient);
                return apiResponse;
            }

            if (TCommonUtils.IsNullOrEmpty(DistrictCode))
            {
                apiResponse.CatchException(false, "MstDistrict_Delete.DistrictCodeIsNotEmpty", requestClient);
                return apiResponse;
            }

            MstDistrictModel? _data = new MstDistrictModel();
            bool isExistRecord = CheckRecordExist(DistrictCode, ref _data);

            if (isExistRecord == false)
            {
                apiResponse.CatchException(false, "MstDistrict_Delete.DistrictNotExistInSystem", requestClient);
                return apiResponse;
            }

            int countRowEffected = await _dbContext.MstDistricts.Where(p => p.DistrictCode == DistrictCode).ExecuteDeleteAsync();

            if (countRowEffected == 0)
            {
                apiResponse.CatchException(false, "MstDistrict_Delete.SomethingWentWrongWithSystem", requestClient);
                return apiResponse;
            }

            return apiResponse;
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

            List<MstDistrictModel> data = await _dbContext.MstDistricts.Where(p => p.FlagActive == true).Select(i =>
                new MstDistrictModel
                {
                    ProvinceCode = i.ProvinceCode,
                    DistrictCode = i.DistrictCode,
                    DistrictName = i.DistrictName,
                    FlagActive = i.FlagActive,
                    CreatedDTime = i.CreatedDTime,
                    UpdatedDTime = i.UpdatedDTime
                }).ToListAsync();

            apiResponse.DataList = data;

            return apiResponse;
        }

        public async Task<byte[]> ExportTemplate()
        {
            DataTable tbData = await this.TemplateTableDistrict();
            byte[] file;

            using (XLWorkbook wb = new XLWorkbook())
            {
                wb.AddWorksheet(tbData, "Mst_District_Template");

                using (MemoryStream ms = new MemoryStream())
                {
                    wb.SaveAs(ms);
                    file = ms.ToArray();
                }
            }

            return file;
        }

        public async Task<ApiResponse<MstDistrictModel>> ImportExcel(IFormFile file)
        {
            ApiResponse<MstDistrictModel> apiResponse = new ApiResponse<MstDistrictModel>();
            List<RequestClient> requestClient = new List<RequestClient>();
            TCommonUtils.GetKeyValuePairRequestClient(file, ref requestClient);

            // Check Permission
            string token = _httpContextAccessor.HttpContext.Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
            bool isAuthorized = GuardAuth.IsAuthorized(token);
            if (!isAuthorized)
            {
                apiResponse.CatchException(false, "GuardAuth.401_Unauthorized", requestClient);
                return apiResponse;
            }

            try
            {
                List<MstDistrictModel> lstDataPreparing = new List<MstDistrictModel>();

                //
                if (file == null || file.Length == 0)
                {
                    apiResponse.CatchException(false, "MstDistrict_ImportExcel.FileIsNotEmpty", requestClient);
                    return apiResponse;
                }

                System.Text.Encoding.RegisterProvider(System.Text.CodePagesEncodingProvider.Instance);
                // Định nghĩa địa chỉ folder để lưu trữ file
                string folderUpload = $"{Directory.GetCurrentDirectory()}\\Uploads";
                if (!Directory.Exists(folderUpload))
                {
                    Directory.CreateDirectory(folderUpload);
                }

                // Định nghĩa đường dẫn file 
                string filePath = Path.Combine(folderUpload, file.FileName);

                // Thực hiện lưu file lên server 
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    file.CopyTo(stream);
                }

                // Thực hiện mở file để đọc nội dung file excel
                using (var stream = File.Open(filePath, FileMode.Open, FileAccess.Read))
                {
                    using (var reader = ExcelReaderFactory.CreateReader(stream))
                    {
                        bool isSkipHeader = false;
                        do
                        {
                            while (reader.Read())
                            {
                                if (!isSkipHeader)
                                {
                                    isSkipHeader = true;
                                    continue;
                                }
                                // Dữ liệu nhập client
                                string DistrictCode = TCommonUtils.ConvertObjectToString(reader.GetValue(0));
                                string DistrictName = TCommonUtils.ConvertObjectToString(reader.GetValue(1));

                                // Chỉ ra bản ghi có lỗi cho client
                                MstDistrictModel currentRecord = new MstDistrictModel
                                {
                                    DistrictCode = DistrictCode,
                                    DistrictName = DistrictName,
                                    FlagActive = true,
                                    CreatedDTime = TCommonUtils.DTimeNow(),
                                    UpdatedDTime = TCommonUtils.DTimeNow(),
                                };

                                // Khóa chính của bảng
                                var primaryKeyRecord = new
                                {
                                    DistrictCode = DistrictCode
                                };

                                RequestClient rqClient = new RequestClient(JsonSerializer.Serialize(primaryKeyRecord), JsonSerializer.Serialize(currentRecord));


                                if (TCommonUtils.IsNullOrEmpty(DistrictCode))
                                {
                                    requestClient.Add(rqClient);
                                    apiResponse.CatchException(false, "MstDistrict_ImportExcel.DistrictCodeIsNotValid", requestClient);
                                    break;
                                }

                                MstDistrictModel? _data = new MstDistrictModel();
                                bool isExistRecord = CheckRecordExist(DistrictCode, ref _data);


                                if (isExistRecord == true)
                                {
                                    requestClient.Add(rqClient);
                                    apiResponse.CatchException(false, "MstDistrict_ImportExcel.DistrictHasAlreadyExists", requestClient);
                                    break;
                                }

                                if (string.IsNullOrEmpty(DistrictName))
                                {
                                    requestClient.Add(rqClient);
                                    apiResponse.CatchException(false, "MstDistrict_ImportExcel.DistrictNameIsNotValid", requestClient);
                                    break;
                                }

                                // Check có bản ghi nào bị trùng với dữ liệu trước đó không
                                if (lstDataPreparing.Count > 0)
                                {
                                    MstDistrictModel rowDuplicate = lstDataPreparing.SingleOrDefault(item => item.DistrictCode == currentRecord.DistrictCode);
                                    if (rowDuplicate != null)
                                    {
                                        requestClient.Add(rqClient);
                                        apiResponse.CatchException(false, "MstDistrict_ImportExcel.DuplicateData", requestClient);
                                        break;
                                    }
                                }

                                // Thêm các bản ghi hợp lệ vào danh sách tạo mới
                                lstDataPreparing.Add(currentRecord);

                            }
                        } while (reader.NextResult());
                    }
                }

                // Thực hiện hủy bỏ toàn bộ dữ liệu nếu bất kì dữ liệu nào của bản ghi không hợp lệ
                if (apiResponse.Success == false)
                {
                    return apiResponse;
                }

                // Thực hiện lưu dữ liệu sau khi toàn bộ dữ liệu đã hợp lệ 
                await _dbContext.MstDistricts.AddRangeAsync(lstDataPreparing);
                await _dbContext.SaveChangesAsync();

                // Xóa file khỏi thư mục lưu trữ trên server
                File.Delete(filePath);
                return apiResponse;
            }
            catch (Exception ex)
            {
                apiResponse.CatchException(false, $"MstDistrict_ImportExcel.OccurProgramException: \n {ex}", requestClient);
                return apiResponse;
            }
        }

        public async Task<byte[]> ExportExcel()
        {
            //ApiResponse<MstDistrictModel> apiResponse = new ApiResponse<MstDistrictModel>();
            //List<RequestClient> requestClient = new List<RequestClient>();

            //// Check Permission
            //string token = _httpContextAccessor.HttpContext.Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
            //bool isAuthorized = GuardAuth.IsAuthorized(token);
            //if (!isAuthorized)
            //{
            //    apiResponse.CatchException(false, "GuardAuth.401_Unauthorized", requestClient);
            //    return apiResponse;
            //}

            DataTable tbData = await this.DataTableDistrict();
            byte[] file;
            //string folderPath = Path.Combine(Directory.GetCurrentDirectory(), "Exports");
            //string fileName = "Mst_District_Data.xlsx";
            //string fullPath = Path.Combine(folderPath, fileName);

            //if (!Directory.Exists(folderPath))
            //{
            //    Directory.CreateDirectory(folderPath);
            //}

            using (XLWorkbook wb = new XLWorkbook())
            {
                wb.AddWorksheet(tbData, "Mst_District");

                using (MemoryStream ms = new MemoryStream())
                {
                    wb.SaveAs(ms);
                    // File.WriteAllBytes(fullPath, ms.ToArray());
                    file = ms.ToArray();
                }
            }

            return file;
        }

        public async Task<DataTable> TemplateTableDistrict()
        {
            DataTable tb = new DataTable();
            tb.TableName = "MstDistrict";
            tb.Columns.Add("DistrictCode", typeof(string));
            tb.Columns.Add("DistrictName", typeof(string));

            return tb;
        }

        public async Task<DataTable> DataTableDistrict()
        {
            DataTable tb = new DataTable();
            tb.TableName = "MstDistrict";
            tb.Columns.Add("DistrictCode", typeof(string));
            tb.Columns.Add("DistrictName", typeof(string));
            tb.Columns.Add("FlagActive", typeof(bool));

            List<MstDistrictModel> Districts = await _dbContext.MstDistricts.Select(p => new MstDistrictModel
            {
                DistrictCode = p.DistrictCode,
                DistrictName = p.DistrictName,
                FlagActive = p.FlagActive,
            }).ToListAsync();

            foreach (MstDistrictModel District in Districts)
            {
                tb.Rows.Add(District.DistrictCode, District.DistrictName, District.FlagActive);
            }

            return tb;
        }
    }
}