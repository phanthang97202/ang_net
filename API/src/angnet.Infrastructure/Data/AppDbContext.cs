using angnet.Domain.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace angnet.Infrastructure.Data
{
    public class AppDbContext : IdentityDbContext<AppUser>
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {

        }

        // 
        public DbSet<TenantModel> Tenant { get; set; }
        public DbSet<MstTenantContactModel> MstTenantContact { get; set; }

        //
        public DbSet<RefreshTokenModel> RefreshToken { get; set; }

        //
        public DbSet<MstProvinceModel> MstProvince { get; set; }
        public DbSet<MstDistrictModel> MstDistrict { get; set; }
        
        //
        public DbSet<MstStadiumModel> MstStadium { get; set; }
        public DbSet<MstStadiumStatusModel> MstStadiumStatus { get; set; }
        public DbSet<MstStadiumTypeModel> MstStadiumType { get; set; }
        public DbSet<MstPaymentTypeModel> MstPaymentType { get; set; }
        public DbSet<OrderStadiumModel> OrderStadium { get; set; }
        public DbSet<AmenityStadiumModel> AmenityStadium { get; set; }

        //
        public DbSet<ChatModel> Chat { get; set; }

        //
        public DbSet<PointNewsModel> PointNews { get; set; }
        public DbSet<NewsCategoryModel> NewsCategory { get; set; }
        public DbSet<HashTagNewsModel> HashTagNews { get; set; }
        public DbSet<RefFileNewsModel> RefFileNews { get; set; }
        public DbSet<LikeNewsModel> LikeNews { get; set; }
        public DbSet<NewsModel> News { get; set; }
        public DbSet<NewsCommentModel> NewsComment { get; set; }
        public DbSet<NewsCommentReactionModel> NewsCommentReaction { get; set; }
        public DbSet<NewsReportCommentModel> NewsReportComment { get; set; }
        public DbSet<NewsCommentMediaModel> NewsCommentMedia { get; set; }
        
        //
        public DbSet<AuditTrailModel> AuditTrail { get; set; }

        //
        public DbSet<GenerationAuthCode> GenerationAuthCode { get; set; }

        // ==========================================================================================
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // TenantModel
            modelBuilder.Entity<TenantModel>(
                e =>
                {
                    e.Property(e => e.TenantAddress)
                    .HasColumnType("jsonb")
                    .HasConversion(
                      v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
                      v => JsonSerializer.Deserialize<TenantAddressModel>(v, (JsonSerializerOptions?)null)!
                  );
                });

            modelBuilder.Entity<TenantModel>()
                .Property(x => x.TenantStatus)
                        .HasConversion<string>(); // cấu hình lưu enum dạng chuỗi => Fix lỗi migrate :42804: column "OrderStatus" cannot be cast automatically to type integer


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

            // MstPaymentTypeModel
            //modelBuilder.Entity<MstPaymentTypeModel>();

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

            // NewsCommentModel
            modelBuilder.Entity<NewsCommentModel>()
                        .HasOne<NewsModel>()
                        .WithMany()
                        .HasForeignKey(p => p.NewsId)
                        .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<NewsCommentModel>()
                        .HasOne<AppUser>()
                        .WithMany()
                        .HasForeignKey(p => p.UserId)
                        .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<NewsCommentModel>() // Quan hệ cha con trong cùng một bảng
                        .HasOne<NewsCommentModel>()
                        .WithMany()
                        .HasForeignKey(p => p.ParentCommentId)
                        .OnDelete(DeleteBehavior.Cascade); // Nếu xóa comment cha thì xóa cả con


            modelBuilder.Entity<NewsCommentModel>()
                        .Property(x => x.Status)
                        .HasConversion<string>(); // cấu hình lưu enum dạng chuỗi => Fix lỗi migrate :42804: column "OrderStatus" cannot be cast automatically to type integer

            // NewsCommentReactionModel
            modelBuilder.Entity<NewsCommentReactionModel>()
                        .HasKey(p => new { p.CommentId, p.UserId });

            modelBuilder.Entity<NewsCommentReactionModel>()
                        .HasOne<NewsCommentModel>()
                        .WithMany()
                        .HasForeignKey(p => p.CommentId)
                        .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<NewsCommentReactionModel>()
                        .HasOne<AppUser>()
                        .WithMany()
                        .HasForeignKey(p => p.UserId)
                        .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<NewsCommentReactionModel>()
                        .Property(x => x.ReactionType)
                        .HasConversion<string>(); // cấu hình lưu enum dạng chuỗi => Fix lỗi migrate :42804: column "OrderStatus" cannot be cast automatically to type integer

            // NewsReportCommentModel
            modelBuilder.Entity<NewsReportCommentModel>()
                        .HasOne<NewsCommentModel>()
                        .WithMany()
                        .HasForeignKey(p => p.CommentId)
                        .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<NewsReportCommentModel>()
                        .HasOne<AppUser>()
                        .WithMany()
                        .HasForeignKey(p => p.UserId)
                        .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<NewsReportCommentModel>()
                        .Property(x => x.Reason)
                        .HasConversion<string>(); // cấu hình lưu enum dạng chuỗi => Fix lỗi migrate :42804: column "OrderStatus" cannot be cast automatically to type integer
            
            modelBuilder.Entity<NewsReportCommentModel>()
                        .Property(x => x.Status)
                        .HasConversion<string>(); // cấu hình lưu enum dạng chuỗi => Fix lỗi migrate :42804: column "OrderStatus" cannot be cast automatically to type integer

            // NewsCommentMediaModel
            modelBuilder.Entity<NewsCommentMediaModel>()
                        .HasOne<NewsCommentModel>()
                        .WithMany()
                        .HasForeignKey(p => p.CommentId)
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