using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection.Emit;
using System.Threading.Tasks;
using API.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace API.Data
{
    public class AppDbContext : IdentityDbContext<AppUser>
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {

        }

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

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

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
            modelBuilder.Entity<MstStadiumModel>()
                        .HasOne<MstDistrictModel>()
                        .WithMany()
                        .HasForeignKey(s => s.StadiumDistrictCode)
                        .OnDelete(DeleteBehavior.Restrict);

            // OrderStadiumModel
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
                        .HasForeignKey(o => o.UserName)
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
            
        }
    }
}