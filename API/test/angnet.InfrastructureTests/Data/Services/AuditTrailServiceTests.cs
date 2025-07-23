using angnet.Application.Interfaces.Services;
using angnet.Domain.Dtos;
using Moq;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using angnet.Domain.Enums;
using Google;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using angnet.Application.Interfaces.Persistences;
using angnet.Application.Interfaces.Repositories;
using angnet.Infrastructure.Data.Repositories;
using Microsoft.AspNetCore.Http;

namespace angnet.Infrastructure.Data.Services.Tests
{
    [TestClass]
    public class AuditTrailServiceTests
    {
        private ServiceProvider _serviceProvider;
        private IAuditTrailService _auditTrailService;
        private string accessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFkbWluM0BnbWFpbC5jb20iLCJuYW1lIjoiVGjEg25nIFBoYW4iLCJuYW1laWQiOiIyNjk4YTEzYS1jOGRjLTQ3YWYtYTdiYS1jNWJmMTdiNWFkNTYiLCJhdWQiOiJodHRwOi8vbG9jYWxob3N0OjQyMDAiLCJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjUwMDAiLCJyb2xlIjoiQWRtaW4iLCJuYmYiOjE3NTMyODUxMTEsImV4cCI6MTc1MzMyODMxMSwiaWF0IjoxNzUzMjg1MTExfQ.1xfJhjI9eAhbHDdykUtBfyFxECgbad0KH8P2K-Ft9Vg";
        [TestInitialize]
        public void Setup()
        {
            var services = new ServiceCollection();
            services.AddHttpContextAccessor();
            services.AddScoped<IUnitOfWork, angnet.Infrastructure.Data.UnitOfWork.UnitOfWork>();

            services.AddScoped<IAuditTrailRespository, AuditTrailRespository>();
            services.AddScoped<IAuditTrailService, AuditTrailService>();

            services.AddScoped<INewsCategoryRespository, NewsCategoryRespository>();
            services.AddScoped<INewsCategoryService, NewsCategoryService>();

            services.AddScoped<IMstProvinceRespository, MstProvinceRespository>();
            services.AddScoped<IMstProvinceService, MstProvinceService>();

            services.AddScoped<IMstStadiumStatusRespository, MstStadiumStatusRespository>();
            services.AddScoped<IMstStadiumStatusService, MstStadiumStatusService>();

            services.AddScoped<IMstStadiumTypeRespository, MstStadiumTypeRespository>();
            services.AddScoped<IMstStadiumTypeService, MstStadiumTypeService>();

            services.AddScoped<IMstStadiumRespository, MstStadiumRespository>();
            services.AddScoped<MstStadiumService>();

            services.AddScoped<IMstDistrictRespository, MstDistrictRespository>();
            services.AddScoped<IMstDistrictService, MstDistrictService>(); 

            services.AddDbContext<AppDbContext>(options =>
                options.UseNpgsql("Host=localhost;Database=angnet;Username=postgres;Password=Admin123!?"));

            // Đăng ký các service phụ thuộc khác của AuditTrailService ở đây nếu có
            _serviceProvider = services.BuildServiceProvider();
        }
 
        [TestMethod]
        public async Task CreateTest()
        {
            var accessor = _serviceProvider.GetRequiredService<IHttpContextAccessor>();
            var context = new DefaultHttpContext();
            context.Request.Headers["Authorization"] = $"Bearer {accessToken}";
            accessor.HttpContext = context;

            var service = _serviceProvider.GetRequiredService<IAuditTrailService>();
            var dto = new AuditTrailDto
            {
                Level = EAuditTrailLevel.DEBUG,
                RecordId = "integration-001",
                Description = "Test insert",
                ChangedColumns = "Name",
                OldValues = "Old"
            };

            var result = await service.Create(dto);

            Assert.IsTrue(result.Success);
        }
         
        [TestMethod]
        public async Task GetAllActiveTest()
        {
            var accessor = _serviceProvider.GetRequiredService<IHttpContextAccessor>();
            var context = new DefaultHttpContext();
            context.Request.Headers["Authorization"] = $"Bearer {accessToken}";
            accessor.HttpContext = context;

            var service = _serviceProvider.GetRequiredService<IAuditTrailService>();

            var result = await service.GetAllActive();

            Assert.IsTrue(result.Success);
        }
    }

}