﻿using API.Data;
using API.Interfaces;
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
    public class MstProvinceRespository : IMstProvinceRespository
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly AppDbContext _dbContext;
        public MstProvinceRespository(AppDbContext appDbContext, IHttpContextAccessor httpContextAccessor)
        {
            _dbContext = appDbContext;
            _httpContextAccessor = httpContextAccessor;
        }

        public bool CheckRecordExist(string key, ref MstProvinceModel data)
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

        public async Task<ApiResponse<MstProvinceModel>> Search(int pageIndex, int pageSize, string keyword)
        {
            ApiResponse<MstProvinceModel> apiResponse = new ApiResponse<MstProvinceModel>();
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
            List<MstProvinceModel> dataResult = new List<MstProvinceModel>();

            IQueryable<MstProvinceModel> query = _dbContext.MstProvinces
                                    .Where(p => !TCommonUtils.IsNullOrEmpty(keyword) ? p.ProvinceName.Contains(keyword) || p.ProvinceCode == keyword : true);

            int itemCount = query.ToList().Count;

            dataResult = query.Skip(_pageIndex * _pageSize)
                             .Take(_pageSize)
                             .ToList();

            PageInfo<MstProvinceModel> pageInfo = new PageInfo<MstProvinceModel>();
            pageInfo.PageIndex = pageIndex;
            pageInfo.PageSize = pageSize;
            pageInfo.PageCount = itemCount % pageSize == 0 ? itemCount / pageSize : itemCount / pageSize + 1;
            pageInfo.ItemCount = itemCount;
            pageInfo.DataList = dataResult.Count == 0 ? new List<MstProvinceModel>() : dataResult;

            apiResponse.objResult = pageInfo;

            return apiResponse;
        }

        public async Task<ApiResponse<MstProvinceModel>> Detail(string key)
        {
            ApiResponse<MstProvinceModel> apiResponse = new ApiResponse<MstProvinceModel>();
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
            MstProvinceModel _data = new MstProvinceModel();
            bool isExistRecord = CheckRecordExist(key, ref _data);

            if (isExistRecord == false)
            {
                apiResponse.CatchException(false, "MstProvince_Detail.ProvinceIsNotExists", requestClient);
                return apiResponse;
            }

            apiResponse.Data = _data;

            return apiResponse;
        }

        public async Task<ApiResponse<MstProvinceModel>> Create(MstProvinceModel data)
        {
            ApiResponse<MstProvinceModel> apiResponse = new ApiResponse<MstProvinceModel>();

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

            if (TCommonUtils.IsNullOrEmpty((data.ProvinceCode)))
            {
                apiResponse.CatchException(false, "MstProvince_Create.ProvinceCodeIsNotValid", requestClient);
                return apiResponse;
            }

            MstProvinceModel? _data = new MstProvinceModel();
            bool isExistRecord = CheckRecordExist(data.ProvinceCode, ref _data);


            if (isExistRecord == true)
            {
                apiResponse.CatchException(false, "MstProvince_Create.ProvinceHasAlreadyExists", requestClient);
                return apiResponse;
            }

            if (string.IsNullOrEmpty(data.ProvinceName))
            {
                apiResponse.CatchException(false, "MstProvince_Create.ProvinceNameIsNotValid", requestClient);
                return apiResponse;
            }

            if (data.FlagActive == false)
            {
                data.FlagActive = true;
            }
            data.CreatedDTime = TCommonUtils.DTimeNow();
            data.UpdatedDTime = TCommonUtils.DTimeNow();

            await _dbContext.MstProvinces.AddAsync(data);
            await _dbContext.SaveChangesAsync();

            apiResponse.Data = data;

            return apiResponse;
        }

        public async Task<ApiResponse<MstProvinceModel>> Update(MstProvinceModel data)
        {
            ApiResponse<MstProvinceModel> apiResponse = new ApiResponse<MstProvinceModel>();
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

            if (TCommonUtils.IsNullOrEmpty(data.ProvinceCode))
            {
                apiResponse.CatchException(false, "MstProvince_Update.ProvinceCodeIsNotValid", requestClient);
                return apiResponse;
            }

            MstProvinceModel? _data = new MstProvinceModel();
            bool isExistRecord = CheckRecordExist(data.ProvinceCode, ref _data);

            if (isExistRecord == false)
            {
                apiResponse.CatchException(false, "MstProvince_Update.ProvinceNotExistInSystem", requestClient);
                return apiResponse;
            }

            if (string.IsNullOrEmpty(data.ProvinceName))
            {
                apiResponse.CatchException(false, "MstProvince_Update.ProvinceNameIsNotValid", requestClient);
                return apiResponse;
            }

            await _dbContext.MstProvinces.Where(p => p.ProvinceCode == data.ProvinceCode)
                .ExecuteUpdateAsync(setter =>
                      setter.SetProperty(p => p.ProvinceName, data.ProvinceName)
                            .SetProperty(p => p.FlagActive, data.FlagActive)
                            .SetProperty(p => p.UpdatedDTime, TCommonUtils.DTimeNow())
                );
            await _dbContext.SaveChangesAsync();

            return apiResponse;
        }

        public async Task<ApiResponse<MstProvinceModel>> Delete(string ProvinceCode)
        {
            ApiResponse<MstProvinceModel> apiResponse = new ApiResponse<MstProvinceModel>();
            List<RequestClient> requestClient = new List<RequestClient>();
            TCommonUtils.GetKeyValuePairRequestClient(ProvinceCode, ref requestClient);

            // Check Permission
            string token = _httpContextAccessor.HttpContext.Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
            bool isAuthorized = GuardAuth.IsAuthorized(token);
            if (!isAuthorized)
            {
                apiResponse.CatchException(false, "GuardAuth.401_Unauthorized", requestClient);
                return apiResponse;
            }

            if (TCommonUtils.IsNullOrEmpty(ProvinceCode))
            {
                apiResponse.CatchException(false, "MstProvince_Delete.ProvinceCodeIsNotEmpty", requestClient);
                return apiResponse;
            }

            MstProvinceModel? _data = new MstProvinceModel();
            bool isExistRecord = CheckRecordExist(ProvinceCode, ref _data);

            if (isExistRecord == false)
            {
                apiResponse.CatchException(false, "MstProvince_Delete.ProvinceNotExistInSystem", requestClient);
                return apiResponse;
            }

            int countRowEffected = await _dbContext.MstProvinces.Where(p => p.ProvinceCode == ProvinceCode).ExecuteDeleteAsync();

            if (countRowEffected == 0)
            {
                apiResponse.CatchException(false, "MstProvince_Delete.SomethingWentWrongWithSystem", requestClient);
                return apiResponse;
            }

            return apiResponse;
        }

        public async Task<ApiResponse<MstProvinceModel>> GetAllActive()
        {
            ApiResponse<MstProvinceModel> apiResponse = new ApiResponse<MstProvinceModel>();
            List<RequestClient> requestClient = new List<RequestClient>();

            // Check Permission
            string token = _httpContextAccessor.HttpContext.Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
            bool isAuthorized = GuardAuth.IsAuthorized(token);
            if (!isAuthorized)
            {
                apiResponse.CatchException(false, "GuardAuth.401_Unauthorized", requestClient);
                return apiResponse;
            }

            List<MstProvinceModel> data = await _dbContext.MstProvinces.Where(p => p.FlagActive == true).Select(i =>
                new MstProvinceModel
                {
                    ProvinceCode = i.ProvinceCode,
                    ProvinceName = i.ProvinceName,
                    FlagActive = i.FlagActive,
                    CreatedDTime = i.CreatedDTime,
                    UpdatedDTime = i.UpdatedDTime
                }).ToListAsync();

            apiResponse.DataList = data;

            return apiResponse;
        }

        public async Task<byte[]> ExportTemplate()
        {
            DataTable tbData = await this.TemplateTableProvince();
            byte[] file;

            using (XLWorkbook wb = new XLWorkbook())
            {
                wb.AddWorksheet(tbData, "Mst_Province_Template");

                using (MemoryStream ms = new MemoryStream())
                {
                    wb.SaveAs(ms);
                    file = ms.ToArray();
                }
            }

            return file;
        }

        public async Task<ApiResponse<MstProvinceModel>> ImportExcel(IFormFile file)
        {
            ApiResponse<MstProvinceModel> apiResponse = new ApiResponse<MstProvinceModel>();
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
                List<MstProvinceModel> lstDataPreparing = new List<MstProvinceModel>();

                //
                if (file == null || file.Length == 0)
                {
                    apiResponse.CatchException(false, "MstProvince_ImportExcel.FileIsNotEmpty", requestClient);
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
                                string provinceCode = TCommonUtils.ConvertObjectToString(reader.GetValue(0));
                                string provinceName = TCommonUtils.ConvertObjectToString(reader.GetValue(1));

                                // Chỉ ra bản ghi có lỗi cho client
                                MstProvinceModel currentRecord = new MstProvinceModel
                                {
                                    ProvinceCode = provinceCode,
                                    ProvinceName = provinceName,
                                    FlagActive = true,
                                    CreatedDTime = TCommonUtils.DTimeNow(),
                                    UpdatedDTime = TCommonUtils.DTimeNow(),
                                };

                                // Khóa chính của bảng
                                var primaryKeyRecord = new
                                {
                                    ProvinceCode = provinceCode
                                };

                                RequestClient rqClient = new RequestClient(JsonSerializer.Serialize(primaryKeyRecord), JsonSerializer.Serialize(currentRecord));


                                if (TCommonUtils.IsNullOrEmpty(provinceCode))
                                {
                                    requestClient.Add(rqClient);
                                    apiResponse.CatchException(false, "MstProvince_ImportExcel.ProvinceCodeIsNotValid", requestClient);
                                    break;
                                }

                                MstProvinceModel? _data = new MstProvinceModel();
                                bool isExistRecord = CheckRecordExist(provinceCode, ref _data);


                                if (isExistRecord == true)
                                {
                                    requestClient.Add(rqClient);
                                    apiResponse.CatchException(false, "MstProvince_ImportExcel.ProvinceHasAlreadyExists", requestClient);
                                    break;
                                }

                                if (string.IsNullOrEmpty(provinceName))
                                {
                                    requestClient.Add(rqClient);
                                    apiResponse.CatchException(false, "MstProvince_ImportExcel.ProvinceNameIsNotValid", requestClient);
                                    break;
                                }

                                // Check có bản ghi nào bị trùng với dữ liệu trước đó không
                                if (lstDataPreparing.Count > 0)
                                {
                                    MstProvinceModel rowDuplicate = lstDataPreparing.SingleOrDefault(item => item.ProvinceCode == currentRecord.ProvinceCode);
                                    if (rowDuplicate != null)
                                    {
                                        requestClient.Add(rqClient);
                                        apiResponse.CatchException(false, "MstProvince_ImportExcel.DuplicateData", requestClient);
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
                await _dbContext.MstProvinces.AddRangeAsync(lstDataPreparing);
                await _dbContext.SaveChangesAsync();

                // Xóa file khỏi thư mục lưu trữ trên server
                File.Delete(filePath);
                return apiResponse;
            }
            catch (Exception ex)
            {
                apiResponse.CatchException(false, $"MstProvince_ImportExcel.OccurProgramException: \n {ex}", requestClient);
                return apiResponse;
            }
        }

        public async Task<byte[]> ExportExcel()
        {
            //ApiResponse<MstProvinceModel> apiResponse = new ApiResponse<MstProvinceModel>();
            //List<RequestClient> requestClient = new List<RequestClient>();

            //// Check Permission
            //string token = _httpContextAccessor.HttpContext.Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
            //bool isAuthorized = GuardAuth.IsAuthorized(token);
            //if (!isAuthorized)
            //{
            //    apiResponse.CatchException(false, "GuardAuth.401_Unauthorized", requestClient);
            //    return apiResponse;
            //}

            DataTable tbData = await this.DataTableProvince();
            byte[] file;
            //string folderPath = Path.Combine(Directory.GetCurrentDirectory(), "Exports");
            //string fileName = "Mst_Province_Data.xlsx";
            //string fullPath = Path.Combine(folderPath, fileName);

            //if (!Directory.Exists(folderPath))
            //{
            //    Directory.CreateDirectory(folderPath);
            //}

            using (XLWorkbook wb = new XLWorkbook())
            {
                wb.AddWorksheet(tbData, "Mst_Province");

                using (MemoryStream ms = new MemoryStream())
                {
                    wb.SaveAs(ms);
                    // File.WriteAllBytes(fullPath, ms.ToArray());
                    file = ms.ToArray();
                }
            }

            return file;
        }

        public async Task<DataTable> TemplateTableProvince()
        {
            DataTable tb = new DataTable();
            tb.TableName = "MstProvince";
            tb.Columns.Add("ProvinceCode", typeof(string));
            tb.Columns.Add("ProvinceName", typeof(string));

            return tb;
        }

        public async Task<DataTable> DataTableProvince()
        {
            DataTable tb = new DataTable();
            tb.TableName = "MstProvince";
            tb.Columns.Add("ProvinceCode", typeof(string));
            tb.Columns.Add("ProvinceName", typeof(string));
            tb.Columns.Add("FlagActive", typeof(bool));

            List<MstProvinceModel> provinces = await _dbContext.MstProvinces.Select(p => new MstProvinceModel
            {
                ProvinceCode = p.ProvinceCode,
                ProvinceName = p.ProvinceName,
                FlagActive = p.FlagActive,
            }).ToListAsync();

            foreach (MstProvinceModel province in provinces)
            {
                tb.Rows.Add(province.ProvinceCode, province.ProvinceName, province.FlagActive);
            }

            return tb;
        }
    }
}