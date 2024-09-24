using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Reflection.Metadata.Ecma335;
using System.Threading.Tasks; 
using API.Data;
using TCommonUtils = API.CommonUtils.CommonUtils;
using API.Dtos;
using API.Interfaces; 
using API.Models;
using ClosedXML.Excel;
using ExcelDataReader;
using Microsoft.EntityFrameworkCore; 
using static System.Runtime.InteropServices.JavaScript.JSType;

namespace API.Respositories
{
    public class MstProvinceRespository : IMstProvinceRespository
    {
        private readonly AppDbContext _dbContext;
        public MstProvinceRespository(AppDbContext appDbContext)
        {
            _dbContext = appDbContext;
        }

        public async Task<ApiResponse<MstProvinceModel>> Create(MstProvinceModel data)
        {
            ApiResponse<MstProvinceModel> apiResponse = new ApiResponse<MstProvinceModel>();
            List<RequestClient> requestClient = new List<RequestClient>();

            if (TCommonUtils.IsNullOrEmpty( (data.ProvinceCode) )) {
                apiResponse.CatchException(false, "MstProvince_Create.ProvinceCodeIsNotValid", requestClient);
                return apiResponse;
            } 
            
            var isExistCode = await _dbContext.MstProvinces.FindAsync(data.ProvinceCode);
            
            if(isExistCode != null)
            { 
                apiResponse.CatchException(false, "MstProvince_Create.ProvinceCodeAlreadyExists", requestClient);
                return apiResponse; 
            }

            if (string.IsNullOrEmpty(data.ProvinceName))
            { 
                apiResponse.CatchException(false, "MstProvince_Create.ProvinceNameIsNotValid", requestClient);
                return apiResponse;
            }

            if(data.FlagActive == false)
            {
                data.FlagActive = true;
            }
            data.CreatedDTime = DateTime.Now;
            data.UpdatedDTime = DateTime.Now;

            await _dbContext.MstProvinces.AddAsync(data);
            await _dbContext.SaveChangesAsync();

            apiResponse.Data = data;

            return apiResponse;
        }
         
        public async Task<bool> Delete(string ProvinceCode)
        {
            if ( ProvinceCode == null)
            {
                return false;
            }

            var isExistCode = await _dbContext.MstProvinces.Where(p => p.ProvinceCode == ProvinceCode).ExecuteDeleteAsync();
             
            return true;
        }

        public async Task<List<MstProvinceModel>> GetAllActive()
        {
            List<MstProvinceModel> data = await _dbContext.MstProvinces.Select(i =>
                new MstProvinceModel
                {
                    ProvinceCode = i.ProvinceCode,
                    ProvinceName = i.ProvinceName,
                    FlagActive = i.FlagActive,
                    CreatedDTime = i.CreatedDTime,
                    UpdatedDTime = i.UpdatedDTime
                }).ToListAsync();

            return data;
        }

        public async Task<bool> ImportExcel(IFormFile file)
        {
            try
            {
                if (file == null || file.Length == 0) {
                    return false;
                }
                System.Text.Encoding.RegisterProvider(System.Text.CodePagesEncodingProvider.Instance);
                // Định nghĩa địa chỉ folder để lưu trữ file
                string folderUpload = $"{Directory.GetCurrentDirectory()}\\Uploads";
                if(!Directory.Exists( folderUpload))
                {
                    Directory.CreateDirectory(folderUpload);
                }

                // Định nghĩa đường dẫn file 
                string filePath = Path.Combine(folderUpload, file.FileName);

                // Thực hiện lưu file lên server 
                using(var stream = new FileStream(filePath, FileMode.Create))
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
                                if(!isSkipHeader)
                                {
                                    isSkipHeader = true;
                                    continue;
                                }
                                MstProvinceModel province = new MstProvinceModel();
                                province.ProvinceCode = reader.GetValue(0).ToString()!;
                                province.ProvinceName = reader.GetValue(1).ToString()!;
                                province.FlagActive = true;

                                await this.Create(province); 
                            }
                        } while (reader.NextResult());
                    }
                }

                // Xóa file khỏi thư mục lưu trữ trên server
                File.Delete(filePath);
                return true;
            }
            catch (Exception ex) {
                new Exception("Error:::", ex);
                return false;
            }
        }

        public async  Task<ApiResponse<MstProvinceModel>> Update(MstProvinceModel data)
        {
            ApiResponse<MstProvinceModel> apiResponse = new ApiResponse<MstProvinceModel>();
            List<RequestClient> requestClient = new List<RequestClient>();

            if (TCommonUtils.IsNullOrEmpty(data.ProvinceCode))
            {  
                apiResponse.CatchException(false, "MstProvince_Update.ProvinceCodeIsNotValid", requestClient);
                return apiResponse;
            }

            var isExistCode = await _dbContext.MstProvinces.FindAsync(data.ProvinceCode);

            if (isExistCode == null)
            {  
                apiResponse.CatchException(false, "MstProvince_Update.ProvinceCodeNotFound", requestClient);
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
                        .SetProperty(p => p.UpdatedDTime, DateTime.Now)
                );
            await _dbContext.SaveChangesAsync();

            return apiResponse;
        }

        public async Task<DataTable> TableProvince() { 
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

            foreach (MstProvinceModel province in provinces) {
                tb.Rows.Add(province.ProvinceCode, province.ProvinceName, province.FlagActive);
            } 

            return tb;
        }

        public async Task<byte[]> ExportExcel()
        {
            DataTable tbData = await this.TableProvince();
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

    }
}