using angnet.Domain.Dtos;
using angnet.Domain.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

using angnet.Domain.Enums;

namespace angnet.Infrastructure.Data
{
    public class AppDbContext : IdentityDbContext<AppUser>
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {

        }

        // 
        public DbSet<TenantModel> Tenants { get; set; }
        public DbSet<MstTenantContactModel> MstTenantContacts { get; set; }

        //
        public DbSet<RefreshTokenModel> RefreshTokens { get; set; }

        //
        public DbSet<MstProvinceModel> MstProvinces { get; set; }
        public DbSet<MstDistrictModel> MstDistricts { get; set; }
        public DbSet<MstStadiumStatusModel> MstStadiumStatuses { get; set; }
        public DbSet<MstStadiumTypeModel> MstStadiumTypes { get; set; }
        public DbSet<MstStadiumModel> MstStadiums { get; set; }
        public DbSet<MstPaymentTypeModel> MstPaymentTypes { get; set; }
        public DbSet<OrderStadiumModel> OrderStadiums { get; set; }
        public DbSet<ChatModel> Chat { get; set; }

        //
        public DbSet<PointNewsModel> PointNews { get; set; }
        public DbSet<NewsCategoryModel> NewsCategory { get; set; }
        public DbSet<HashTagNewsModel> HashTagNews { get; set; }
        public DbSet<RefFileNewsModel> RefFileNews { get; set; }
        public DbSet<LikeNewsModel> LikeNews { get; set; }
        public DbSet<NewsModel> News { get; set; }
        public DbSet<AuditTrailModel> AuditTrail { get; set; }
        public DbSet<GenerationAuthCode> GenerationAuthCode { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // TenantModel
            modelBuilder.Entity<TenantModel>();

            // MstTenantContactModel
            modelBuilder.Entity<MstTenantContactModel>()
                        .HasOne<TenantModel>()
                        .WithMany()
                        .HasForeignKey(p => p.TenantId)
                        .OnDelete(DeleteBehavior.Cascade); 

            // RefreshTokenModel
            modelBuilder.Entity<RefreshTokenModel>()
                        .HasOne<AppUser>()
                        .WithMany()
                        .HasForeignKey(r => r.UserId)
                        .OnDelete(DeleteBehavior.Restrict); // Nếu tồn tại bản ghi con thì không cho xóa cha

            // ChatModel
            modelBuilder.Entity<ChatModel>().ToTable("Chat");

            // MstDistrictModel
            modelBuilder.Entity<MstDistrictModel>()
                        .HasOne<MstProvinceModel>()
                        .WithMany()
                        .HasForeignKey(d => d.ProvinceCode)
                        .OnDelete(DeleteBehavior.Restrict);

            // MstStadiumModel
            modelBuilder.Entity<MstStadiumModel>()
                        .HasOne<MstStadiumStatusModel>()
                        .WithMany()
                        .HasForeignKey(s => s.StadiumStatusCode)
                        .OnDelete(DeleteBehavior.Restrict);
            modelBuilder.Entity<MstStadiumModel>()
                        .HasOne<MstStadiumTypeModel>()
                        .WithMany()
                        .HasForeignKey(s => s.StadiumTypeCode)
                        .OnDelete(DeleteBehavior.Restrict);

            // MstStadiumFileModel
            modelBuilder.Entity<MstStadiumFileModel>()
                        .HasOne<MstStadiumModel>()
                        .WithMany()
                        .HasForeignKey(p => p.StadiumCode)
                        .OnDelete(DeleteBehavior.Cascade); // Nếu xóa bản ghi cha thì xóa cả con
            //modelBuilder.Entity<MstStadiumModel>()
            //            .HasOne<MstDistrictModel>()
            //            .WithMany()
            //            .HasForeignKey(s => s.DistrictCode)
            //            .OnDelete(DeleteBehavior.Restrict);
            modelBuilder.Entity<MstStadiumModel>()
                        .HasOne<MstDistrictModel>()
                        .WithMany()
                        .HasForeignKey(d => d.DistrictCode)
                        .OnDelete(DeleteBehavior.Cascade);


            // OrderStadiumModel
            modelBuilder.Entity<OrderStadiumModel>()
                        .Property(x => x.OrderStatus)
                        .HasConversion<string>(); // cấu hình lưu enum dạng chuỗi => Fix lỗi migrate :42804: column "OrderStatus" cannot be cast automatically to type integer

            modelBuilder.Entity<OrderStadiumModel>()
                        .HasOne<MstStadiumModel>()
                        .WithMany()
                        .HasForeignKey(o => o.StadiumCode)
                        .OnDelete(DeleteBehavior.Restrict);
            modelBuilder.Entity<OrderStadiumModel>()
                        .HasOne<MstPaymentTypeModel>()
                        .WithMany()
                        .HasForeignKey(o => o.PaymentTypeCode)
                        .OnDelete(DeleteBehavior.Restrict);
            modelBuilder.Entity<OrderStadiumModel>()
                        .HasOne<AppUser>()
                        .WithMany()
                        .HasForeignKey(o => o.UserId)
                        .OnDelete(DeleteBehavior.Restrict);

            // OrderStadiumStatusLogModel
            modelBuilder.Entity<OrderStadiumStatusLogModel>()
                        .Property(x => x.Status)
                        .HasConversion<string>(); // cấu hình lưu enum dạng chuỗi => Fix lỗi migrate :42804: column "OrderStatus" cannot be cast automatically to type integer

            modelBuilder.Entity<OrderStadiumStatusLogModel>()
                        .Property(x => x.PreviousStatus)
                        .HasConversion<string>(); // cấu hình lưu enum dạng chuỗi => Fix lỗi migrate :42804: column "OrderStatus" cannot be cast automatically to type integer

            modelBuilder.Entity<OrderStadiumStatusLogModel>()
                        .HasOne<OrderStadiumModel>()
                        .WithMany()
                        .HasForeignKey(o => o.OrderStadiumId)
                        .OnDelete(DeleteBehavior.Restrict);
            modelBuilder.Entity<OrderStadiumStatusLogModel>()
                        .HasOne<AppUser>()
                        .WithMany()
                        .HasForeignKey(o => o.UserId)
                        .OnDelete(DeleteBehavior.Restrict);

            // PointNewsModel
            modelBuilder.Entity<PointNewsModel>()
                        .HasKey(p => new { p.NewsId, p.UserId });
            modelBuilder.Entity<PointNewsModel>()
                        .HasOne<NewsModel>()
                        .WithMany()
                        .HasForeignKey(p => p.NewsId)
                        .OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<PointNewsModel>()
                        .HasOne<AppUser>()
                        .WithMany()
                        .HasForeignKey(p => p.UserId)
                        .OnDelete(DeleteBehavior.Cascade);

            // NewsCategoryModel
            modelBuilder.Entity<NewsCategoryModel>();

            // HashTagNewsModel
            modelBuilder.Entity<HashTagNewsModel>()
                        .HasKey(p => new { p.HashTagNewsId, p.NewsId });
            modelBuilder.Entity<HashTagNewsModel>()
                        .HasOne<NewsModel>()
                        .WithMany()
                        .HasForeignKey(p => p.NewsId)
                        .OnDelete(DeleteBehavior.Cascade);

            // RefFileNewsModel
            modelBuilder.Entity<RefFileNewsModel>()
                        .HasOne<NewsModel>()
                        .WithMany()
                        .HasForeignKey(p => p.NewsId)
                        .OnDelete(DeleteBehavior.Cascade);

            // LikeNews
            modelBuilder.Entity<LikeNewsModel>()
                        .HasOne<NewsModel>()
                        .WithMany()
                        .HasForeignKey(p => p.NewsId)
                        .OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<LikeNewsModel>()
                        .HasOne<AppUser>()
                        .WithMany()
                        .HasForeignKey(p => p.UserId)
                        .OnDelete(DeleteBehavior.Cascade);

            // NewsModel
            modelBuilder.Entity<NewsModel>()
                        .HasOne<AppUser>()
                        .WithMany()
                        .HasForeignKey(p => p.UserId)
                        .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<NewsModel>()
                        .HasOne<NewsCategoryModel>()
                        .WithMany()
                        .HasForeignKey(p => p.CategoryNewsId)
                        .OnDelete(DeleteBehavior.Cascade);

            // AuditTrail
            modelBuilder.Entity<AuditTrailModel>()
                .Property(x => x.TrailType)
                .HasConversion<string>(); // cấu hình lưu enum dạng chuỗi => Fix lỗi migrate :42804: column "OrderStatus" cannot be cast automatically to type integer;

            modelBuilder.Entity<AuditTrailModel>()
                .Property(x => x.Level)
                .HasConversion<string>(); // cấu hình lưu enum dạng chuỗi => Fix lỗi migrate :42804: column "OrderStatus" cannot be cast automatically to type integer;

            // GenerationAuthCode
            modelBuilder.Entity<GenerationAuthCode>()
                .HasKey(p => new { p.Id }); // gen code 
        }
    }
}