using angnet.Application.Interfaces.Persistences;
using angnet.Application.Interfaces.Repositories;
using angnet.Application.Interfaces.Services;
using angnet.Infrastructure.Data.Repositories;
using angnet.Infrastructure.Data.Services;
using angnet.Infrastructure.Data.UnitOfWork;
using angnet.Infrastructure.Mail.Consumer;
using angnet.Infrastructure.Mail.Factory;
using angnet.Infrastructure.Mail.Producer;
using angnet.Infrastructure.Mail.Service;
using Microsoft.Extensions.DependencyInjection; 

namespace angnet.Infrastructure
{
    public static class DependencyInjection
    {
        //Khái niệm   Ý nghĩa
        //this IServiceCollection services    Định nghĩa phương thức mở rộng cho IServiceCollection
        //Extension method    Thêm chức năng cho class mà không sửa chính class đó
        //public static class TenClassTuyY
        //{
        //    public static void TenPhuongThucMoRong(this KieuCanMoRong obj, ...)
        //    {
        //        // logic
        //    }
        //}
        //Khi viết từ khóa this trước tham số đầu tiên trong static method, bạn đang nói rằng:
        //Đây là phương thức mở rộng cho kiểu dữ liệu đó.

        public static IServiceCollection AddInfrastructure(this IServiceCollection services)
        {
            // Add services to the container.
            //AddTransient: Tạo mới mỗi khi được yêu cầu.
            //AddScoped: Tạo một instance cho mỗi HTTP request.
            //AddSingleton: Tạo một instance duy nhất cho toàn bộ ứng dụng.
            services.AddScoped<IChatRepository, ChatRespository>();
            services.AddScoped<INewsRespository, NewsRespository>();
            services.AddScoped<IAccountRespository, AccountRespository>();
            services.AddScoped<IHashTagNewsRespository, HashTagNewsRespository>();

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
            services.AddScoped<IMstStadiumService, MstStadiumService>();

            services.AddScoped<IMstDistrictRespository, MstDistrictRespository>();
            services.AddScoped<IMstDistrictService, MstDistrictService>();

            services.AddScoped<ITenantRepository, TenantRepository>();
            services.AddScoped<ITenantService, TenantService>();

            services.AddScoped<IUnitOfWork, UnitOfWork>();

            // Register services
            //services.AddSingleton<RabbitMqConnectionFactory>();
            services.AddSingleton<EmailSenderService>();
            services.AddSingleton<RabbitMqEmailProducer>();
            services.AddHostedService<RabbitMqEmailConsumer>();

            return services;
        }
    }
}
// ============ Unit Of Work Pattern ============ 
//          +------------------------+
//          | Controller |  ⬅️ Inject Service
//          +------------------------+
//          			⬇
//          +------------------------+
//          |      Service Layer     |  ⬅️ Inject IUnitOfWork
//          +------------------------+
//          			⬇
//          +------------------------+
//          |    UnitOfWork Layer    |  ⬅️ Inject Repositories
//          | - NewsRepository       |
//          | - CategoryNewsRepo     |
//          | - SaveChangesAsync()   |
//          | - Dispose()           |
//          +------------------------+
//          			⬇
//          +------------------------+
//          |   Repository Layer     |  ⬅️ Inject AppDbContext
//          | - Chỉ thao tác DB      |
//          | - Không gọi SaveChanges|
//          +------------------------+
//          			⬇
//          +------------------------+
//          |       Database         |
//          +------------------------+
// dùng AddScoped để: 
//      Đảm bảo DbContext dùng chung trong 1 request,
//      Tránh xung đột dữ liệu nếu có nhiều thao tác db trong cùng 1 request,
//      Quản lý transaction dễ dàng khi gọi SaveChangesAsync() trong 1 lần duy nhất,
//      Hiệu suất tốt