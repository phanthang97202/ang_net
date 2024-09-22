using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using API.Data;
using API.Interfaces;
using API.Models;
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

        public async Task<bool> Create(MstProvinceModel data)
        {
            if (data.ProvinceCode == null) { 
                return false;
            } 
            
            var isExistCode = await _dbContext.MstProvinces.FindAsync(data.ProvinceCode);
            
            if(isExistCode != null)
            {
                return false;
            }

            if (string.IsNullOrEmpty(data.ProvinceName))
            {
                return false;
            }
            if(data.FlagActive == false)
            {
                data.FlagActive = true;
            }

            await _dbContext.MstProvinces.AddAsync(data);
            await _dbContext.SaveChangesAsync();

            return true; 
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
                    FlagActive = i.FlagActive
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
                string folderUpload = $"{Directory.GetCurrentDirectory()}\\Uploads";
                if(!Directory.Exists( folderUpload))
                {
                    Directory.CreateDirectory(folderUpload);
                }
                string filePath = Path.Combine(folderUpload, file.FileName);
                using(var stream = new FileStream(filePath, FileMode.Create))
                {
                    file.CopyTo(stream);  
                }
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
                File.Delete(filePath);
                return true;
            }
            catch (Exception ex) {
                new Exception("Error:::", ex);
                return false;
            }
        }

        public async  Task<bool> Update(MstProvinceModel data)
        {
            if (data.ProvinceCode == null)
            {
                return false;
            }

            var isExistCode = await _dbContext.MstProvinces.FindAsync(data.ProvinceCode);

            if (isExistCode == null)
            {
                return false;
            }

            if (string.IsNullOrEmpty(data.ProvinceName))
            {
                return false;
            } 

            await _dbContext.MstProvinces.ExecuteUpdateAsync(setter => 
                setter.SetProperty(p => p.ProvinceName, data.ProvinceName)
                        .SetProperty(p => p.FlagActive, data.FlagActive)
                        .SetProperty(p => p.UpdatedDTime, DateTime.Now)
                );
            await _dbContext.SaveChangesAsync();

            return true;
        }
    }
}