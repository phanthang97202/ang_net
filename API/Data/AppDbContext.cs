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

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<ChatModel>().ToTable("Chat");
            

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

            modelBuilder.Entity<MstDistrictModel>()
                .HasOne<MstProvinceModel>()
                .WithMany()
                .HasForeignKey(d => d.ProvinceCode)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<MstStadiumModel>()
                .HasOne<MstDistrictModel>()
                .WithMany()
                .HasForeignKey(s => s.StadiumDistrictCode)
                .OnDelete(DeleteBehavior.Restrict);

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
        }
    }
}