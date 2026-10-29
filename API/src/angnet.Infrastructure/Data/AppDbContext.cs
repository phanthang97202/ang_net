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
        //public DbSet<AmenityStadiumModel> AmenityStadium { get; set; } // Dang dở

        //
        public DbSet<ChatModel> Chat { get; set; }
        public DbSet<ChatImage> ChatImages { get; set; }
        public DbSet<ChatReadState> ChatReadStates { get; set; }

        //
        public DbSet<PointNewsModel> PointNews { get; set; }
        public DbSet<NewsCategoryModel> NewsCategory { get; set; }
        public DbSet<HashTagNewsModel> HashTagNews { get; set; }
        public DbSet<RefFileNewsModel> RefFileNews { get; set; }
        public DbSet<LikeNewsModel> LikeNews { get; set; }
        public DbSet<BlogActivityModel> BlogActivity { get; set; }
        public DbSet<BlogNotificationModel> BlogNotification { get; set; }
        public DbSet<NewsModel> News { get; set; }
        public DbSet<NewsCommentModel> NewsComment { get; set; }
        public DbSet<NewsCommentReactionModel> NewsCommentReaction { get; set; }
        public DbSet<NewsReportCommentModel> NewsReportComment { get; set; }
        public DbSet<NewsCommentMediaModel> NewsCommentMedia { get; set; }
        
        //
        public DbSet<AuditTrailModel> AuditTrail { get; set; }

        //
        public DbSet<SubscriberModel> Subscriber { get; set; }
        public DbSet<EmailDeliveryModel> EmailDelivery { get; set; }

        //
        public DbSet<GenerationAuthCode> GenerationAuthCode { get; set; }

        // Extension: Shift Report 
        public DbSet<ShiftReportModel> ShiftReport { get; set; }
        public DbSet<ShiftReportTransactionModel> ShiftReportTransaction { get; set; }
        public DbSet<ShiftReportRoomSaleModel> ShiftReportRoomSale { get; set; }
        public DbSet<ShiftReportDrinkSaleModel> ShiftReportDrinkSale { get; set; }

        // Tham số hệ thống
        public DbSet<SysParameterModel> SysParameter { get; set; }

        // Danh mục quyền. Việc gán quyền vào vai trò nằm ở bảng AspNetRoleClaims
        // có sẵn của Identity, không phải ở đây.
        public DbSet<SysPermissionModel> SysPermission { get; set; }

        // Menu điều hướng ngoài trang chủ (2 cấp qua ParentId tự tham chiếu).
        public DbSet<SysMenuModel> SysMenu { get; set; }

        // Ghi chú công khai
        public DbSet<NoteModel> Note { get; set; }
        public DbSet<PersonalNoteModel> PersonalNote { get; set; }
        public DbSet<PersonalCalendarEventModel> PersonalCalendarEvent { get; set; }
        public DbSet<PersonalCalendarOccurrenceStatusModel> PersonalCalendarOccurrenceStatus { get; set; }
        public DbSet<PersonalExpenseModel> PersonalExpense { get; set; }
        public DbSet<PersonalExpenseCategoryModel> PersonalExpenseCategory { get; set; }
        public DbSet<ChineseExerciseModel> ChineseExercise { get; set; }
        public DbSet<ChineseVocabularyModel> ChineseVocabulary { get; set; }
        // Danh sách chọn (dropdown) của từng người dùng, dùng chung cho mọi module
        public DbSet<LookupListModel> LookupList { get; set; }

        // Reels
        public DbSet<ReelModel> Reel { get; set; }
        public DbSet<ReelMediaModel> ReelMedia { get; set; }
        public DbSet<LikeReelModel> LikeReel { get; set; }
        public DbSet<ReelCommentModel> ReelComment { get; set; }

        // Thư viện lưu trữ (bộ sưu tập cá nhân)
        public DbSet<ArchiveCollectionModel> ArchiveCollection { get; set; }
        public DbSet<ArchiveItemModel> ArchiveItem { get; set; }

        // Thư viện nhạc: danh mục bài dùng chung + Đã lưu + bộ sưu tập nhạc
        public DbSet<MusicTrackModel> MusicTrack { get; set; }
        public DbSet<MusicSaveModel> MusicSave { get; set; }
        public DbSet<MusicCollectionModel> MusicCollection { get; set; }
        public DbSet<MusicCollectionItemModel> MusicCollectionItem { get; set; }
        public DbSet<MusicAnalyticsEventModel> MusicAnalyticsEvent { get; set; }

        // Anime: metadata tách khỏi tập và nguồn phát để có thể mở rộng provider sau này.
        public DbSet<AnimeModel> Anime { get; set; }
        public DbSet<AnimeEpisodeModel> AnimeEpisode { get; set; }
        public DbSet<AnimeSourceModel> AnimeSource { get; set; }

        public DbSet<MovieWishlistModel> MovieWishlist { get; set; }
        public DbSet<MovieWatchProgressModel> MovieWatchProgress { get; set; }
        public DbSet<AnalyticsEventModel> AnalyticsEvent { get; set; }
        public DbSet<AnalyticsLedgerModel> AnalyticsLedger { get; set; }
        public DbSet<AnalyticsGapModel> AnalyticsGap { get; set; }
        public DbSet<AnalyticsPresenceModel> AnalyticsPresence { get; set; }
        public DbSet<AnalyticsCollectionModel> AnalyticsCollection { get; set; }
        public DbSet<WebsiteSessionModel> WebsiteSession { get; set; }
        public DbSet<MovieViewLogModel> MovieViewLog { get; set; }
        public DbSet<AnalyticsLegacySnapshotModel> AnalyticsLegacySnapshot { get; set; }

        // ==========================================================================================
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<AnalyticsCollectionModel>().Property(x => x.Id).ValueGeneratedNever();
            modelBuilder.Entity<AnalyticsLedgerModel>().ToTable(t =>
            {
                t.HasCheckConstraint("CK_AnalyticsLedger_RecordType", "\"RecordType\" IN ('event','balance','excluded')");
                t.HasCheckConstraint("CK_AnalyticsLedger_Kind", "\"Kind\" IN ('session','page','article','reel','movie')");
                t.HasCheckConstraint("CK_AnalyticsLedger_EventGrain", "\"RecordType\" <> 'event' OR (\"Quantity\"=1 AND \"Period\"='')");
                t.HasCheckConstraint("CK_AnalyticsLedger_Excluded", "\"RecordType\" <> 'excluded' OR NOT \"Included\"");
            });
            modelBuilder.Entity<AnalyticsLedgerModel>().HasIndex(x => x.LegacyAuditTrailId)
                .IsUnique().HasFilter("\"LegacyAuditTrailId\" IS NOT NULL");
            modelBuilder.Entity<AnalyticsLedgerModel>().HasIndex(x => x.SourceId).IsUnique()
                .HasDatabaseName("IX_AnalyticsLedger_RedisSource").HasFilter("\"Source\"='Redis.VisitStats' AND \"RecordType\"='balance'");
            modelBuilder.Entity<WebsiteSessionModel>().HasIndex(x => x.VisitorId)
                .IsUnique().HasDatabaseName("IX_WebsiteSession_CurrentVisitor").HasFilter("\"IsCurrent\"");
            modelBuilder.Entity<MovieViewLogModel>().HasIndex(x => x.LegacyAuditTrailId)
                .IsUnique().HasFilter("\"LegacyAuditTrailId\" IS NOT NULL");
            modelBuilder.Entity<PersonalNoteModel>().HasOne<AppUser>().WithMany()
                .HasForeignKey(n => n.OwnerId).OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<PersonalCalendarEventModel>().HasOne<AppUser>().WithMany()
                .HasForeignKey(x => x.OwnerId).OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<PersonalCalendarEventModel>().HasIndex(x => new { x.OwnerId, x.StartDate, x.EndDate });
            modelBuilder.Entity<PersonalCalendarEventModel>().Property(x => x.Version).IsConcurrencyToken();
            modelBuilder.Entity<PersonalCalendarOccurrenceStatusModel>().HasKey(x => new { x.EventId, x.OccurrenceDate });
            modelBuilder.Entity<PersonalCalendarOccurrenceStatusModel>().HasOne<PersonalCalendarEventModel>().WithMany()
                .HasForeignKey(x => x.EventId).OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<PersonalExpenseModel>().HasOne<AppUser>().WithMany().HasForeignKey(x => x.OwnerId).OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<PersonalExpenseModel>().HasIndex(x => new { x.OwnerId, x.Date });
            modelBuilder.Entity<PersonalExpenseModel>().Property(x => x.Version).IsConcurrencyToken();
            modelBuilder.Entity<PersonalExpenseCategoryModel>().HasOne<AppUser>().WithMany().HasForeignKey(x => x.OwnerId).OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<PersonalExpenseCategoryModel>().HasIndex(x => new { x.OwnerId, x.NormalizedName }).IsUnique();
            modelBuilder.Entity<ChineseExerciseModel>().HasOne<AppUser>().WithMany().HasForeignKey(x => x.OwnerId).OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<ChineseExerciseModel>().HasIndex(x => new { x.OwnerId, x.Kind, x.Topic });
            modelBuilder.Entity<ChineseVocabularyModel>().HasOne<AppUser>().WithMany().HasForeignKey(x => x.OwnerId).OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<ChineseVocabularyModel>().HasIndex(x => new { x.OwnerId, x.Collection, x.Word }).IsUnique();
            modelBuilder.Entity<LookupListModel>().HasOne<AppUser>().WithMany().HasForeignKey(x => x.OwnerId).OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<LookupListModel>().HasIndex(x => new { x.OwnerId, x.ListCode, x.Code }).IsUnique();
            modelBuilder.Entity<LookupListModel>().HasIndex(x => new { x.OwnerId, x.ListCode, x.SortOrder });
            modelBuilder.Entity<PersonalNoteModel>()
                .HasIndex(n => new { n.OwnerId, n.UpdatedAt, n.NoteId });
            modelBuilder.Entity<PersonalNoteModel>().Property(n => n.Version).IsConcurrencyToken();
            modelBuilder.Entity<PersonalNoteModel>().HasIndex(n => n.PublicToken).IsUnique();
            modelBuilder.Entity<PersonalNoteModel>().HasIndex(n => n.EditToken).IsUnique();
            modelBuilder.Entity<BlogNotificationModel>().HasOne<AppUser>().WithMany()
                .HasForeignKey(n => n.RecipientId).OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<BlogNotificationModel>().HasOne<AppUser>().WithMany()
                .HasForeignKey(n => n.ActorId).OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<BlogNotificationModel>().HasOne<NewsModel>().WithMany()
                .HasForeignKey(n => n.NewsId).OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<BlogNotificationModel>().HasOne<NewsCommentModel>().WithMany()
                .HasForeignKey(n => n.CommentId).OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<BlogNotificationModel>().HasIndex(n => new { n.RecipientId, n.CommentId }).IsUnique();
            modelBuilder.Entity<BlogNotificationModel>()
                .HasIndex(n => new { n.RecipientId, n.ActorId, n.NewsId, n.Kind }).IsUnique()
                .HasFilter("\"CommentId\" IS NULL");
            modelBuilder.Entity<BlogNotificationModel>().HasIndex(n => new { n.RecipientId, n.CreatedAt, n.NotificationId });
            modelBuilder.Entity<BlogNotificationModel>().HasIndex(n => new { n.RecipientId, n.ReadAt });
            base.OnModelCreating(modelBuilder);
            modelBuilder.UseOpenIddict();

            modelBuilder.Entity<MovieWatchProgressModel>()
                .HasKey(x => new { x.UserId, x.Provider, x.MovieSlug });
            modelBuilder.Entity<MovieWatchProgressModel>()
                .HasOne<AppUser>().WithMany().HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<BlogActivityModel>().HasOne<AppUser>().WithMany()
                .HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<BlogActivityModel>().HasOne<NewsModel>().WithMany()
                .HasForeignKey(x => x.NewsId).OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<BlogActivityModel>()
                .HasIndex(x => new { x.UserId, x.OccurredAt, x.ActivityId })
                .IsDescending(false, true, true);
            modelBuilder.Entity<LikeNewsModel>()
                .HasIndex(x => new { x.UserId, x.CreatedDTime, x.LikeNewsId })
                .IsDescending(false, true, true);

            modelBuilder.Entity<AppUser>().HasIndex(x => x.NormalizedEmail)
                .HasDatabaseName("EmailIndex").IsUnique().HasFilter("\"NormalizedEmail\" IS NOT NULL");

            modelBuilder.Entity<MovieWishlistModel>()
                .HasOne<AppUser>().WithMany().HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<MovieWishlistModel>()
                .HasIndex(x => new { x.UserId, x.Provider, x.MovieSlug }).IsUnique();
            modelBuilder.Entity<MovieWishlistModel>()
                .HasIndex(x => new { x.UserId, x.Provider, x.FlagActive, x.CreatedDTime, x.WishlistId })
                .HasDatabaseName("IX_MovieWishlist_Owner_Feed")
                .IsDescending(false, false, false, true, true);

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
            modelBuilder.Entity<ChatModel>().HasIndex(c => c.Sequence).IsUnique();
            modelBuilder.Entity<ChatImage>().ToTable("ChatImage");
            modelBuilder.Entity<ChatImage>().HasOne<ChatModel>().WithOne()
                .HasForeignKey<ChatImage>(i => i.MessageId).OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<ChatReadState>().ToTable("ChatReadState");
            modelBuilder.Entity<ChatReadState>().HasOne<AppUser>().WithMany()
                .HasForeignKey(s => s.UserId).OnDelete(DeleteBehavior.Cascade);

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
                        .HasKey(p => new { p.HashTagNewsId, p.NewsId, p.LanguageCode });
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

            modelBuilder.Entity<NewsModel>()
                        .Property(x => x.WhoCanSee)
                        .HasConversion<string>();

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

            // ReelModel
            modelBuilder.Entity<ReelModel>()
                        .HasOne<AppUser>()
                        .WithMany()
                        .HasForeignKey(p => p.UserId)
                        .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ReelModel>()
                        .Property(x => x.MediaType)
                        .HasConversion<string>(); // Không convert thì EF ghi enum dạng số vào cột varchar(20), lỗi khi Create

            // ReelMediaModel
            modelBuilder.Entity<ReelMediaModel>()
                        .Property(x => x.IsCloudinaryManaged).HasDefaultValue(false);
            modelBuilder.Entity<ReelMediaModel>()
                        .HasOne<ReelModel>()
                        .WithMany()
                        .HasForeignKey(p => p.ReelId)
                        .OnDelete(DeleteBehavior.Cascade);

            // LikeReelModel
            modelBuilder.Entity<LikeReelModel>()
                        .HasOne<ReelModel>()
                        .WithMany()
                        .HasForeignKey(p => p.ReelId)
                        .OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<LikeReelModel>()
                        .HasOne<AppUser>()
                        .WithMany()
                        .HasForeignKey(p => p.UserId)
                        .OnDelete(DeleteBehavior.Cascade);

            // ReelCommentModel
            modelBuilder.Entity<ReelCommentModel>()
                        .HasOne<ReelModel>()
                        .WithMany()
                        .HasForeignKey(p => p.ReelId)
                        .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ReelCommentModel>()
                        .HasOne<AppUser>()
                        .WithMany()
                        .HasForeignKey(p => p.UserId)
                        .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ReelCommentModel>() // Quan hệ cha con trong cùng một bảng (reply)
                        .HasOne<ReelCommentModel>()
                        .WithMany()
                        .HasForeignKey(p => p.ParentCommentId)
                        .OnDelete(DeleteBehavior.Cascade);

            // ArchiveCollectionModel
            modelBuilder.Entity<ArchiveCollectionModel>()
                        .HasOne<AppUser>()
                        .WithMany()
                        .HasForeignKey(p => p.OwnerId)
                        .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ArchiveCollectionModel>()
                        .Property(x => x.Visibility)
                        .HasConversion<string>();

            modelBuilder.Entity<ArchiveCollectionModel>()
                        .HasIndex(x => new { x.OwnerId, x.SortOrder });

            // ArchiveItemModel
            modelBuilder.Entity<ArchiveItemModel>()
                        .HasOne<ArchiveCollectionModel>()
                        .WithMany()
                        .HasForeignKey(p => p.CollectionId)
                        .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<AnimeModel>()
                        .HasIndex(x => x.AniListId)
                        .IsUnique();

            modelBuilder.Entity<AnimeEpisodeModel>()
                        .HasOne<AnimeModel>()
                        .WithMany()
                        .HasForeignKey(x => x.AnimeId)
                        .OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<AnimeEpisodeModel>()
                        .HasIndex(x => new { x.AnimeId, x.EpisodeNumber })
                        .IsUnique();

            modelBuilder.Entity<AnimeSourceModel>()
                        .HasOne<AnimeEpisodeModel>()
                        .WithMany()
                        .HasForeignKey(x => x.EpisodeId)
                        .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ArchiveItemModel>()
                        .HasOne<AppUser>()
                        .WithMany()
                        .HasForeignKey(p => p.OwnerId)
                        .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ArchiveItemModel>()
                        .Property(x => x.Kind)
                        .HasConversion<string>();

            modelBuilder.Entity<ArchiveItemModel>()
                        .Property(x => x.Provider)
                        .HasConversion<string>();

            modelBuilder.Entity<ArchiveItemModel>()
                        .HasIndex(x => new { x.CollectionId, x.CreatedDTime });

            modelBuilder.Entity<ArchiveItemModel>()
                        .HasIndex(x => x.OwnerId);

            // Thư viện nhạc - xem chú thích ở script 0067_ThuVienNhac.sql
            modelBuilder.Entity<MusicTrackModel>()
                        .Property(x => x.Provider)
                        .HasConversion<string>();
            modelBuilder.Entity<MusicTrackModel>()
                        .Property(x => x.Availability)
                        .HasConversion<string>();
            modelBuilder.Entity<MusicTrackModel>()
                        .HasIndex(x => new { x.Provider, x.ExternalId })
                        .IsUnique();

            modelBuilder.Entity<MusicSaveModel>()
                        .HasKey(x => new { x.UserId, x.TrackId });
            modelBuilder.Entity<MusicSaveModel>()
                        .HasOne<AppUser>().WithMany().HasForeignKey(x => x.UserId)
                        .OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<MusicSaveModel>()
                        .HasOne<MusicTrackModel>().WithMany().HasForeignKey(x => x.TrackId)
                        .OnDelete(DeleteBehavior.Restrict);
            modelBuilder.Entity<MusicSaveModel>()
                        .HasIndex(x => new { x.UserId, x.CreatedDTime })
                        .IsDescending(false, true);

            modelBuilder.Entity<MusicCollectionModel>()
                        .HasOne<AppUser>().WithMany().HasForeignKey(x => x.OwnerId)
                        .OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<MusicCollectionModel>()
                        .Property(x => x.Visibility)
                        .HasConversion<string>();
            modelBuilder.Entity<MusicCollectionModel>()
                        .HasIndex(x => new { x.OwnerId, x.SortOrder });

            modelBuilder.Entity<MusicCollectionItemModel>()
                        .HasKey(x => new { x.CollectionId, x.TrackId });
            modelBuilder.Entity<MusicCollectionItemModel>()
                        .HasOne<MusicCollectionModel>().WithMany().HasForeignKey(x => x.CollectionId)
                        .OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<MusicCollectionItemModel>()
                        .HasOne<MusicTrackModel>().WithMany().HasForeignKey(x => x.TrackId)
                        .OnDelete(DeleteBehavior.Restrict);
            modelBuilder.Entity<MusicCollectionItemModel>()
                        .HasOne<AppUser>().WithMany().HasForeignKey(x => x.OwnerId)
                        .OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<MusicCollectionItemModel>()
                        .HasIndex(x => new { x.CollectionId, x.SortOrder });
            modelBuilder.Entity<MusicCollectionItemModel>()
                        .HasIndex(x => new { x.OwnerId, x.TrackId });

            // Subscriber: chặn trùng email ngay ở DB thay vì chỉ kiểm tra trong code -
            // hai request đăng ký cùng lúc cùng một email đều thấy "chưa tồn tại" rồi
            // cùng ghi vào.
            modelBuilder.Entity<SubscriberModel>()
                        .HasIndex(x => x.Email)
                        .IsUnique();

            modelBuilder.Entity<EmailDeliveryModel>()
                        .HasIndex(x => new { x.NewsId, x.SubscriberId })
                        .IsUnique();

            modelBuilder.Entity<EmailDeliveryModel>()
                        .HasIndex(x => new { x.Status, x.CreatedDTime });

            modelBuilder.Entity<EmailDeliveryModel>()
                        .HasOne<NewsModel>()
                        .WithMany()
                        .HasForeignKey(x => x.NewsId)
                        .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<EmailDeliveryModel>()
                        .HasOne<SubscriberModel>()
                        .WithMany()
                        .HasForeignKey(x => x.SubscriberId)
                        .OnDelete(DeleteBehavior.Restrict);

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

            // Extension: Shift report
            // ShiftReport configuration
            modelBuilder.Entity<ShiftReportModel>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).UseIdentityAlwaysColumn();

                entity.HasIndex(e => e.ShiftDate);
                entity.HasIndex(e => e.ReceptionistName);

                entity.Property(e => e.TotalCash).HasDefaultValue(0);
                entity.Property(e => e.TotalTransfer).HasDefaultValue(0);
                entity.Property(e => e.TotalExpense).HasDefaultValue(0);
                entity.Property(e => e.HandoverAmount).HasDefaultValue(0);
                entity.Property(e => e.HandoverNote).IsRequired().HasDefaultValue(string.Empty);
            });

            // ShiftReportTransaction configuration
            modelBuilder.Entity<ShiftReportTransactionModel>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).UseIdentityAlwaysColumn();

                entity.HasOne(e => e.ShiftReport)
                    .WithMany(e => e.Transactions)
                    .HasForeignKey(e => e.ShiftReportId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasIndex(e => e.ShiftReportId);
            });

            // ShiftReportRoomSale configuration
            modelBuilder.Entity<ShiftReportRoomSaleModel>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).UseIdentityAlwaysColumn();

                entity.HasOne(e => e.ShiftReport)
                    .WithMany(e => e.RoomSales)
                    .HasForeignKey(e => e.ShiftReportId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasIndex(e => e.ShiftReportId);
            });

            modelBuilder.Entity<ShiftReportDrinkSaleModel>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).UseIdentityAlwaysColumn();

                entity.HasOne(e => e.ShiftReport)
                    .WithMany(e => e.DrinkSales)
                    .HasForeignKey(e => e.ShiftReportId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasIndex(e => e.ShiftReportId);
                // Tinh ton kho phai cong don Quantity theo ProductCode
                entity.HasIndex(e => e.ProductCode);
            });
        }
    }
}
