using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using API.Data;
using API.Interfaces;
using API.Models;
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