using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace angnet.Infrastructure.Data.Persistences.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AspNetRoles",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    Name = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    NormalizedName = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    ConcurrencyStamp = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetRoles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUsers",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    TenantId = table.Column<int>(type: "integer", nullable: false),
                    FullName = table.Column<string>(type: "text", nullable: false),
                    Avatar = table.Column<string>(type: "text", nullable: false),
                    Address = table.Column<string>(type: "text", nullable: false),
                    FlagActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedDTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedDTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UserName = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    NormalizedUserName = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    Email = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    NormalizedEmail = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    EmailConfirmed = table.Column<bool>(type: "boolean", nullable: false),
                    PasswordHash = table.Column<string>(type: "text", nullable: true),
                    SecurityStamp = table.Column<string>(type: "text", nullable: true),
                    ConcurrencyStamp = table.Column<string>(type: "text", nullable: true),
                    PhoneNumber = table.Column<string>(type: "text", nullable: true),
                    PhoneNumberConfirmed = table.Column<bool>(type: "boolean", nullable: false),
                    TwoFactorEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    LockoutEnd = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    LockoutEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    AccessFailedCount = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUsers", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AuditTrail",
                columns: table => new
                {
                    AuditTrailId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    RecordId = table.Column<string>(type: "text", nullable: false),
                    IPAddress = table.Column<string>(type: "text", nullable: false),
                    Level = table.Column<string>(type: "text", nullable: false),
                    RequestUrl = table.Column<string>(type: "text", nullable: false),
                    TrailType = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: false),
                    ChangedColumns = table.Column<string>(type: "text", nullable: false),
                    OldValues = table.Column<string>(type: "text", nullable: false),
                    NewValues = table.Column<string>(type: "text", nullable: false),
                    ChangedBy = table.Column<string>(type: "text", nullable: false),
                    ChangedDTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsRevoked = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AuditTrail", x => x.AuditTrailId);
                });

            migrationBuilder.CreateTable(
                name: "Chat",
                columns: table => new
                {
                    MessageId = table.Column<string>(type: "text", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    Type = table.Column<string>(type: "text", nullable: false),
                    Message = table.Column<string>(type: "text", nullable: false),
                    FlagActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: false),
                    UpdatedBy = table.Column<string>(type: "text", nullable: false),
                    CreatedDTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedDTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Chat", x => x.MessageId);
                });

            migrationBuilder.CreateTable(
                name: "GenerationAuthCode",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    Token = table.Column<string>(type: "text", nullable: false),
                    Salt = table.Column<string>(type: "text", nullable: false),
                    AttemptCount = table.Column<int>(type: "integer", nullable: false),
                    Type = table.Column<string>(type: "text", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    ExpiredAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsUsed = table.Column<bool>(type: "boolean", nullable: false),
                    FlagActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: false),
                    UpdatedBy = table.Column<string>(type: "text", nullable: false),
                    CreatedDTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedDTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GenerationAuthCode", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "MstPaymentType",
                columns: table => new
                {
                    PaymentTypeCode = table.Column<string>(type: "text", nullable: false),
                    PaymentTypeName = table.Column<string>(type: "text", nullable: false),
                    FlagActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: false),
                    UpdatedBy = table.Column<string>(type: "text", nullable: false),
                    CreatedDTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedDTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MstPaymentType", x => x.PaymentTypeCode);
                });

            migrationBuilder.CreateTable(
                name: "MstProvince",
                columns: table => new
                {
                    ProvinceCode = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    ProvinceName = table.Column<string>(type: "text", nullable: false),
                    TenantId = table.Column<string>(type: "text", nullable: false),
                    FlagActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: false),
                    UpdatedBy = table.Column<string>(type: "text", nullable: false),
                    CreatedDTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedDTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MstProvince", x => x.ProvinceCode);
                });

            migrationBuilder.CreateTable(
                name: "MstStadiumStatus",
                columns: table => new
                {
                    StadiumStatusCode = table.Column<string>(type: "text", nullable: false),
                    StadiumStatusName = table.Column<string>(type: "text", nullable: false),
                    FlagActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: false),
                    UpdatedBy = table.Column<string>(type: "text", nullable: false),
                    CreatedDTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedDTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MstStadiumStatus", x => x.StadiumStatusCode);
                });

            migrationBuilder.CreateTable(
                name: "MstStadiumType",
                columns: table => new
                {
                    StadiumTypeCode = table.Column<string>(type: "text", nullable: false),
                    StadiumTypeName = table.Column<string>(type: "text", nullable: false),
                    StadiumTypeSalePercent = table.Column<decimal>(type: "numeric", nullable: false),
                    Remark = table.Column<string>(type: "text", nullable: false),
                    FlagActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: false),
                    UpdatedBy = table.Column<string>(type: "text", nullable: false),
                    CreatedDTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedDTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MstStadiumType", x => x.StadiumTypeCode);
                });

            migrationBuilder.CreateTable(
                name: "NewsCategory",
                columns: table => new
                {
                    NewsCategoryId = table.Column<string>(type: "text", nullable: false),
                    TenantId = table.Column<string>(type: "text", nullable: false),
                    NewsCategoryParentId = table.Column<string>(type: "text", nullable: false),
                    NewsCategoryName = table.Column<string>(type: "text", nullable: false),
                    NewsCategoryIndex = table.Column<int>(type: "integer", nullable: false),
                    IsGlobal = table.Column<bool>(type: "boolean", nullable: false),
                    FlagActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: false),
                    UpdatedBy = table.Column<string>(type: "text", nullable: false),
                    CreatedDTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedDTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NewsCategory", x => x.NewsCategoryId);
                });

            migrationBuilder.CreateTable(
                name: "ShiftReport",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityAlwaysColumn),
                    ShiftDate = table.Column<DateOnly>(type: "date", nullable: false),
                    ShiftType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    StartTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    EndTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ReceptionistName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    TotalCash = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false, defaultValue: 0m),
                    TotalTransfer = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false, defaultValue: 0m),
                    TotalExpense = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false, defaultValue: 0m),
                    HandoverAmount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false, defaultValue: 0m),
                    ReceiverName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    FlagActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: false),
                    UpdatedBy = table.Column<string>(type: "text", nullable: false),
                    CreatedDTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedDTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ShiftReport", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "Tenant",
                columns: table => new
                {
                    TenantId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TenantCode = table.Column<string>(type: "text", nullable: false),
                    TenantName = table.Column<string>(type: "text", nullable: false),
                    OwnedBy = table.Column<string>(type: "text", nullable: false),
                    TenantPrefixHost = table.Column<string>(type: "text", nullable: false),
                    TenantHost = table.Column<string>(type: "text", nullable: false),
                    TenantConnectionString = table.Column<string>(type: "text", nullable: false),
                    TenantDatabaseName = table.Column<string>(type: "text", nullable: false),
                    TenantLogo = table.Column<string>(type: "text", nullable: false),
                    TenantDescription = table.Column<string>(type: "text", nullable: false),
                    TenantAddress = table.Column<string>(type: "jsonb", nullable: false),
                    TenantStatus = table.Column<string>(type: "varchar(20)", nullable: false),
                    Remark = table.Column<string>(type: "text", nullable: false),
                    FlagActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: false),
                    UpdatedBy = table.Column<string>(type: "text", nullable: false),
                    CreatedDTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedDTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Tenant", x => x.TenantId);
                });

            migrationBuilder.CreateTable(
                name: "AspNetRoleClaims",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    RoleId = table.Column<string>(type: "text", nullable: false),
                    ClaimType = table.Column<string>(type: "text", nullable: true),
                    ClaimValue = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetRoleClaims", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AspNetRoleClaims_AspNetRoles_RoleId",
                        column: x => x.RoleId,
                        principalTable: "AspNetRoles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserClaims",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    ClaimType = table.Column<string>(type: "text", nullable: true),
                    ClaimValue = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUserClaims", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AspNetUserClaims_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserLogins",
                columns: table => new
                {
                    LoginProvider = table.Column<string>(type: "text", nullable: false),
                    ProviderKey = table.Column<string>(type: "text", nullable: false),
                    ProviderDisplayName = table.Column<string>(type: "text", nullable: true),
                    UserId = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUserLogins", x => new { x.LoginProvider, x.ProviderKey });
                    table.ForeignKey(
                        name: "FK_AspNetUserLogins_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserRoles",
                columns: table => new
                {
                    UserId = table.Column<string>(type: "text", nullable: false),
                    RoleId = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUserRoles", x => new { x.UserId, x.RoleId });
                    table.ForeignKey(
                        name: "FK_AspNetUserRoles_AspNetRoles_RoleId",
                        column: x => x.RoleId,
                        principalTable: "AspNetRoles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AspNetUserRoles_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserTokens",
                columns: table => new
                {
                    UserId = table.Column<string>(type: "text", nullable: false),
                    LoginProvider = table.Column<string>(type: "text", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Value = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUserTokens", x => new { x.UserId, x.LoginProvider, x.Name });
                    table.ForeignKey(
                        name: "FK_AspNetUserTokens_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "RefreshToken",
                columns: table => new
                {
                    RefreshToken = table.Column<string>(type: "text", nullable: false),
                    TenantId = table.Column<string>(type: "text", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    ExpiryDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsRevoked = table.Column<bool>(type: "boolean", nullable: false),
                    FlagActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: false),
                    UpdatedBy = table.Column<string>(type: "text", nullable: false),
                    CreatedDTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedDTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RefreshToken", x => x.RefreshToken);
                    table.ForeignKey(
                        name: "FK_RefreshToken_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "MstDistrict",
                columns: table => new
                {
                    DistrictCode = table.Column<string>(type: "text", nullable: false),
                    ProvinceCode = table.Column<string>(type: "character varying(10)", nullable: false),
                    DistrictName = table.Column<string>(type: "text", nullable: false),
                    FlagActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: false),
                    UpdatedBy = table.Column<string>(type: "text", nullable: false),
                    CreatedDTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedDTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MstDistrict", x => x.DistrictCode);
                    table.ForeignKey(
                        name: "FK_MstDistrict_MstProvince_ProvinceCode",
                        column: x => x.ProvinceCode,
                        principalTable: "MstProvince",
                        principalColumn: "ProvinceCode",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "News",
                columns: table => new
                {
                    NewsId = table.Column<string>(type: "text", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    CategoryNewsId = table.Column<string>(type: "text", nullable: false),
                    Slug = table.Column<string>(type: "text", nullable: false),
                    Thumbnail = table.Column<string>(type: "text", nullable: false),
                    ShortTitle = table.Column<string>(type: "text", nullable: false),
                    ShortDescription = table.Column<string>(type: "text", nullable: false),
                    ContentBody = table.Column<string>(type: "text", nullable: false),
                    ViewCount = table.Column<int>(type: "integer", nullable: false),
                    ShareCount = table.Column<int>(type: "integer", nullable: false),
                    LikeCount = table.Column<int>(type: "integer", nullable: false),
                    AvgPoint = table.Column<double>(type: "double precision", nullable: false),
                    WhoCanSee = table.Column<string>(type: "varchar(20)", nullable: false),
                    FlagActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: false),
                    UpdatedBy = table.Column<string>(type: "text", nullable: false),
                    CreatedDTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedDTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_News", x => x.NewsId);
                    table.ForeignKey(
                        name: "FK_News_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_News_NewsCategory_CategoryNewsId",
                        column: x => x.CategoryNewsId,
                        principalTable: "NewsCategory",
                        principalColumn: "NewsCategoryId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ShiftReportRoomSale",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityAlwaysColumn),
                    ShiftReportId = table.Column<int>(type: "integer", nullable: false),
                    RoomNumber = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    RoomCategory = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    UnitPrice = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    FlagActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: false),
                    UpdatedBy = table.Column<string>(type: "text", nullable: false),
                    CreatedDTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedDTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ShiftReportRoomSale", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ShiftReportRoomSale_ShiftReport_ShiftReportId",
                        column: x => x.ShiftReportId,
                        principalTable: "ShiftReport",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ShiftReportTransaction",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityAlwaysColumn),
                    ShiftReportId = table.Column<int>(type: "integer", nullable: false),
                    OrderNumber = table.Column<int>(type: "integer", nullable: false),
                    RoomNumber = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    InvoiceCode = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    CustomerType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    CashAmount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    TransferAmount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    PrepaidNote = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    ExpenseDescription = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    ExpenseAmount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    FlagActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: false),
                    UpdatedBy = table.Column<string>(type: "text", nullable: false),
                    CreatedDTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedDTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ShiftReportTransaction", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ShiftReportTransaction_ShiftReport_ShiftReportId",
                        column: x => x.ShiftReportId,
                        principalTable: "ShiftReport",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MstTenantContact",
                columns: table => new
                {
                    TenantContactId = table.Column<string>(type: "text", nullable: false),
                    TenantId = table.Column<int>(type: "integer", nullable: false),
                    TenantContactName = table.Column<string>(type: "varchar(20)", nullable: false),
                    TenantContactValue = table.Column<string>(type: "text", nullable: false),
                    FlagActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: false),
                    UpdatedBy = table.Column<string>(type: "text", nullable: false),
                    CreatedDTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedDTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MstTenantContact", x => x.TenantContactId);
                    table.ForeignKey(
                        name: "FK_MstTenantContact_Tenant_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenant",
                        principalColumn: "TenantId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MstStadium",
                columns: table => new
                {
                    StadiumCode = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: false),
                    StadiumTypeCode = table.Column<string>(type: "text", nullable: false),
                    StadiumStatusCode = table.Column<string>(type: "text", nullable: false),
                    DistrictCode = table.Column<string>(type: "text", nullable: false),
                    TenantId = table.Column<string>(type: "text", nullable: false),
                    FlagStadiumRent = table.Column<bool>(type: "boolean", nullable: false),
                    StadiumName = table.Column<string>(type: "text", nullable: false),
                    StadiumPrice = table.Column<decimal>(type: "numeric", nullable: false),
                    StadiumDescription = table.Column<string>(type: "text", nullable: false),
                    StadiumAddress = table.Column<string>(type: "text", nullable: false),
                    StadiumSalePercent = table.Column<decimal>(type: "numeric", nullable: false),
                    Remark = table.Column<string>(type: "text", nullable: false),
                    FlagActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: false),
                    UpdatedBy = table.Column<string>(type: "text", nullable: false),
                    CreatedDTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedDTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MstStadium", x => x.StadiumCode);
                    table.ForeignKey(
                        name: "FK_MstStadium_MstDistrict_DistrictCode",
                        column: x => x.DistrictCode,
                        principalTable: "MstDistrict",
                        principalColumn: "DistrictCode",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MstStadium_MstStadiumStatus_StadiumStatusCode",
                        column: x => x.StadiumStatusCode,
                        principalTable: "MstStadiumStatus",
                        principalColumn: "StadiumStatusCode",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_MstStadium_MstStadiumType_StadiumTypeCode",
                        column: x => x.StadiumTypeCode,
                        principalTable: "MstStadiumType",
                        principalColumn: "StadiumTypeCode",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "HashTagNews",
                columns: table => new
                {
                    HashTagNewsId = table.Column<string>(type: "text", nullable: false),
                    NewsId = table.Column<string>(type: "text", nullable: false),
                    HashTagNewsName = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    Count = table.Column<int>(type: "integer", nullable: false),
                    FlagActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: false),
                    UpdatedBy = table.Column<string>(type: "text", nullable: false),
                    CreatedDTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedDTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HashTagNews", x => new { x.HashTagNewsId, x.NewsId });
                    table.ForeignKey(
                        name: "FK_HashTagNews_News_NewsId",
                        column: x => x.NewsId,
                        principalTable: "News",
                        principalColumn: "NewsId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "LikeNews",
                columns: table => new
                {
                    LikeNewsId = table.Column<string>(type: "text", nullable: false),
                    NewsId = table.Column<string>(type: "text", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    FlagActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: false),
                    UpdatedBy = table.Column<string>(type: "text", nullable: false),
                    CreatedDTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedDTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LikeNews", x => x.LikeNewsId);
                    table.ForeignKey(
                        name: "FK_LikeNews_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_LikeNews_News_NewsId",
                        column: x => x.NewsId,
                        principalTable: "News",
                        principalColumn: "NewsId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "NewsComment",
                columns: table => new
                {
                    CommentId = table.Column<string>(type: "text", nullable: false),
                    NewsId = table.Column<string>(type: "text", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    ParentCommentId = table.Column<string>(type: "text", nullable: true),
                    Content = table.Column<string>(type: "text", nullable: false),
                    ReplyCount = table.Column<int>(type: "integer", nullable: false),
                    ReactionCount = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<string>(type: "varchar(20)", nullable: false),
                    FlagActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: false),
                    UpdatedBy = table.Column<string>(type: "text", nullable: false),
                    CreatedDTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedDTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NewsComment", x => x.CommentId);
                    table.ForeignKey(
                        name: "FK_NewsComment_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_NewsComment_NewsComment_ParentCommentId",
                        column: x => x.ParentCommentId,
                        principalTable: "NewsComment",
                        principalColumn: "CommentId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_NewsComment_News_NewsId",
                        column: x => x.NewsId,
                        principalTable: "News",
                        principalColumn: "NewsId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PointNews",
                columns: table => new
                {
                    NewsId = table.Column<string>(type: "text", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    Point = table.Column<double>(type: "double precision", nullable: false),
                    FlagActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: false),
                    UpdatedBy = table.Column<string>(type: "text", nullable: false),
                    CreatedDTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedDTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PointNews", x => new { x.NewsId, x.UserId });
                    table.ForeignKey(
                        name: "FK_PointNews_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PointNews_News_NewsId",
                        column: x => x.NewsId,
                        principalTable: "News",
                        principalColumn: "NewsId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "RefFileNews",
                columns: table => new
                {
                    RefFileNewsId = table.Column<string>(type: "text", nullable: false),
                    NewsId = table.Column<string>(type: "text", nullable: false),
                    FileUrl = table.Column<string>(type: "text", nullable: false),
                    FlagActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: false),
                    UpdatedBy = table.Column<string>(type: "text", nullable: false),
                    CreatedDTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedDTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RefFileNews", x => x.RefFileNewsId);
                    table.ForeignKey(
                        name: "FK_RefFileNews_News_NewsId",
                        column: x => x.NewsId,
                        principalTable: "News",
                        principalColumn: "NewsId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MstStadiumFileModel",
                columns: table => new
                {
                    StadiumFileId = table.Column<string>(type: "text", nullable: false),
                    StadiumCode = table.Column<string>(type: "character varying(250)", nullable: false),
                    FileUrl = table.Column<string>(type: "text", nullable: false),
                    FlagActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: false),
                    UpdatedBy = table.Column<string>(type: "text", nullable: false),
                    CreatedDTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedDTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MstStadiumFileModel", x => x.StadiumFileId);
                    table.ForeignKey(
                        name: "FK_MstStadiumFileModel_MstStadium_StadiumCode",
                        column: x => x.StadiumCode,
                        principalTable: "MstStadium",
                        principalColumn: "StadiumCode",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "OrderStadium",
                columns: table => new
                {
                    OrderStadiumId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    OrderStadiumCode = table.Column<string>(type: "text", nullable: false),
                    StadiumCode = table.Column<string>(type: "character varying(250)", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    OderDTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    RentDTimeFrom = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    RentDTimeTo = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    PaymentTypeCode = table.Column<string>(type: "text", nullable: false),
                    PreMoney = table.Column<decimal>(type: "numeric", nullable: false),
                    RefundMoney = table.Column<decimal>(type: "numeric", nullable: false),
                    VAT = table.Column<decimal>(type: "numeric", nullable: false),
                    SalePercent = table.Column<decimal>(type: "numeric", nullable: false),
                    DebtMoney = table.Column<decimal>(type: "numeric", nullable: false),
                    Remark = table.Column<string>(type: "text", nullable: false),
                    OrderStatus = table.Column<string>(type: "varchar(20)", nullable: false),
                    VoucherCode = table.Column<string>(type: "text", nullable: false),
                    FlagActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: false),
                    UpdatedBy = table.Column<string>(type: "text", nullable: false),
                    CreatedDTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedDTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OrderStadium", x => x.OrderStadiumId);
                    table.ForeignKey(
                        name: "FK_OrderStadium_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_OrderStadium_MstPaymentType_PaymentTypeCode",
                        column: x => x.PaymentTypeCode,
                        principalTable: "MstPaymentType",
                        principalColumn: "PaymentTypeCode",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_OrderStadium_MstStadium_StadiumCode",
                        column: x => x.StadiumCode,
                        principalTable: "MstStadium",
                        principalColumn: "StadiumCode",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "NewsCommentMedia",
                columns: table => new
                {
                    MediaId = table.Column<string>(type: "text", nullable: false),
                    CommentId = table.Column<string>(type: "text", nullable: false),
                    Url = table.Column<string>(type: "text", nullable: false),
                    MediaType = table.Column<string>(type: "varchar(20)", nullable: false),
                    FlagActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: false),
                    UpdatedBy = table.Column<string>(type: "text", nullable: false),
                    CreatedDTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedDTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NewsCommentMedia", x => x.MediaId);
                    table.ForeignKey(
                        name: "FK_NewsCommentMedia_NewsComment_CommentId",
                        column: x => x.CommentId,
                        principalTable: "NewsComment",
                        principalColumn: "CommentId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "NewsCommentReaction",
                columns: table => new
                {
                    CommentId = table.Column<string>(type: "text", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    ReactionType = table.Column<string>(type: "varchar(20)", nullable: false),
                    FlagActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: false),
                    UpdatedBy = table.Column<string>(type: "text", nullable: false),
                    CreatedDTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedDTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NewsCommentReaction", x => new { x.CommentId, x.UserId });
                    table.ForeignKey(
                        name: "FK_NewsCommentReaction_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_NewsCommentReaction_NewsComment_CommentId",
                        column: x => x.CommentId,
                        principalTable: "NewsComment",
                        principalColumn: "CommentId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "NewsReportComment",
                columns: table => new
                {
                    ReportId = table.Column<string>(type: "text", nullable: false),
                    CommentId = table.Column<string>(type: "text", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    Reason = table.Column<string>(type: "varchar(50)", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "varchar(20)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NewsReportComment", x => x.ReportId);
                    table.ForeignKey(
                        name: "FK_NewsReportComment_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_NewsReportComment_NewsComment_CommentId",
                        column: x => x.CommentId,
                        principalTable: "NewsComment",
                        principalColumn: "CommentId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "OrderStadiumStatusLogModel",
                columns: table => new
                {
                    OrderStadiumStatusLogId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    OrderStadiumId = table.Column<int>(type: "integer", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    PreviousStatus = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    ChangedData = table.Column<string>(type: "text", nullable: false),
                    Note = table.Column<string>(type: "text", nullable: false),
                    IpAddress = table.Column<string>(type: "text", nullable: false),
                    FlagActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: false),
                    UpdatedBy = table.Column<string>(type: "text", nullable: false),
                    CreatedDTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedDTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OrderStadiumStatusLogModel", x => x.OrderStadiumStatusLogId);
                    table.ForeignKey(
                        name: "FK_OrderStadiumStatusLogModel_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_OrderStadiumStatusLogModel_OrderStadium_OrderStadiumId",
                        column: x => x.OrderStadiumId,
                        principalTable: "OrderStadium",
                        principalColumn: "OrderStadiumId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AspNetRoleClaims_RoleId",
                table: "AspNetRoleClaims",
                column: "RoleId");

            migrationBuilder.CreateIndex(
                name: "RoleNameIndex",
                table: "AspNetRoles",
                column: "NormalizedName",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUserClaims_UserId",
                table: "AspNetUserClaims",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUserLogins_UserId",
                table: "AspNetUserLogins",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUserRoles_RoleId",
                table: "AspNetUserRoles",
                column: "RoleId");

            migrationBuilder.CreateIndex(
                name: "EmailIndex",
                table: "AspNetUsers",
                column: "NormalizedEmail");

            migrationBuilder.CreateIndex(
                name: "UserNameIndex",
                table: "AspNetUsers",
                column: "NormalizedUserName",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_HashTagNews_NewsId",
                table: "HashTagNews",
                column: "NewsId");

            migrationBuilder.CreateIndex(
                name: "IX_LikeNews_NewsId",
                table: "LikeNews",
                column: "NewsId");

            migrationBuilder.CreateIndex(
                name: "IX_LikeNews_UserId",
                table: "LikeNews",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_MstDistrict_ProvinceCode",
                table: "MstDistrict",
                column: "ProvinceCode");

            migrationBuilder.CreateIndex(
                name: "IX_MstStadium_DistrictCode",
                table: "MstStadium",
                column: "DistrictCode");

            migrationBuilder.CreateIndex(
                name: "IX_MstStadium_StadiumStatusCode",
                table: "MstStadium",
                column: "StadiumStatusCode");

            migrationBuilder.CreateIndex(
                name: "IX_MstStadium_StadiumTypeCode",
                table: "MstStadium",
                column: "StadiumTypeCode");

            migrationBuilder.CreateIndex(
                name: "IX_MstStadiumFileModel_StadiumCode",
                table: "MstStadiumFileModel",
                column: "StadiumCode");

            migrationBuilder.CreateIndex(
                name: "IX_MstTenantContact_TenantId",
                table: "MstTenantContact",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_News_CategoryNewsId",
                table: "News",
                column: "CategoryNewsId");

            migrationBuilder.CreateIndex(
                name: "IX_News_UserId",
                table: "News",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_NewsComment_NewsId",
                table: "NewsComment",
                column: "NewsId");

            migrationBuilder.CreateIndex(
                name: "IX_NewsComment_ParentCommentId",
                table: "NewsComment",
                column: "ParentCommentId");

            migrationBuilder.CreateIndex(
                name: "IX_NewsComment_UserId",
                table: "NewsComment",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_NewsCommentMedia_CommentId",
                table: "NewsCommentMedia",
                column: "CommentId");

            migrationBuilder.CreateIndex(
                name: "IX_NewsCommentReaction_UserId",
                table: "NewsCommentReaction",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_NewsReportComment_CommentId",
                table: "NewsReportComment",
                column: "CommentId");

            migrationBuilder.CreateIndex(
                name: "IX_NewsReportComment_UserId",
                table: "NewsReportComment",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_OrderStadium_PaymentTypeCode",
                table: "OrderStadium",
                column: "PaymentTypeCode");

            migrationBuilder.CreateIndex(
                name: "IX_OrderStadium_StadiumCode",
                table: "OrderStadium",
                column: "StadiumCode");

            migrationBuilder.CreateIndex(
                name: "IX_OrderStadium_UserId",
                table: "OrderStadium",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_OrderStadiumStatusLogModel_OrderStadiumId",
                table: "OrderStadiumStatusLogModel",
                column: "OrderStadiumId");

            migrationBuilder.CreateIndex(
                name: "IX_OrderStadiumStatusLogModel_UserId",
                table: "OrderStadiumStatusLogModel",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_PointNews_UserId",
                table: "PointNews",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_RefFileNews_NewsId",
                table: "RefFileNews",
                column: "NewsId");

            migrationBuilder.CreateIndex(
                name: "IX_RefreshToken_UserId",
                table: "RefreshToken",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_ShiftReport_ReceptionistName",
                table: "ShiftReport",
                column: "ReceptionistName");

            migrationBuilder.CreateIndex(
                name: "IX_ShiftReport_ShiftDate",
                table: "ShiftReport",
                column: "ShiftDate");

            migrationBuilder.CreateIndex(
                name: "IX_ShiftReportRoomSale_ShiftReportId",
                table: "ShiftReportRoomSale",
                column: "ShiftReportId");

            migrationBuilder.CreateIndex(
                name: "IX_ShiftReportTransaction_ShiftReportId",
                table: "ShiftReportTransaction",
                column: "ShiftReportId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AspNetRoleClaims");

            migrationBuilder.DropTable(
                name: "AspNetUserClaims");

            migrationBuilder.DropTable(
                name: "AspNetUserLogins");

            migrationBuilder.DropTable(
                name: "AspNetUserRoles");

            migrationBuilder.DropTable(
                name: "AspNetUserTokens");

            migrationBuilder.DropTable(
                name: "AuditTrail");

            migrationBuilder.DropTable(
                name: "Chat");

            migrationBuilder.DropTable(
                name: "GenerationAuthCode");

            migrationBuilder.DropTable(
                name: "HashTagNews");

            migrationBuilder.DropTable(
                name: "LikeNews");

            migrationBuilder.DropTable(
                name: "MstStadiumFileModel");

            migrationBuilder.DropTable(
                name: "MstTenantContact");

            migrationBuilder.DropTable(
                name: "NewsCommentMedia");

            migrationBuilder.DropTable(
                name: "NewsCommentReaction");

            migrationBuilder.DropTable(
                name: "NewsReportComment");

            migrationBuilder.DropTable(
                name: "OrderStadiumStatusLogModel");

            migrationBuilder.DropTable(
                name: "PointNews");

            migrationBuilder.DropTable(
                name: "RefFileNews");

            migrationBuilder.DropTable(
                name: "RefreshToken");

            migrationBuilder.DropTable(
                name: "ShiftReportRoomSale");

            migrationBuilder.DropTable(
                name: "ShiftReportTransaction");

            migrationBuilder.DropTable(
                name: "AspNetRoles");

            migrationBuilder.DropTable(
                name: "Tenant");

            migrationBuilder.DropTable(
                name: "NewsComment");

            migrationBuilder.DropTable(
                name: "OrderStadium");

            migrationBuilder.DropTable(
                name: "ShiftReport");

            migrationBuilder.DropTable(
                name: "News");

            migrationBuilder.DropTable(
                name: "MstPaymentType");

            migrationBuilder.DropTable(
                name: "MstStadium");

            migrationBuilder.DropTable(
                name: "AspNetUsers");

            migrationBuilder.DropTable(
                name: "NewsCategory");

            migrationBuilder.DropTable(
                name: "MstDistrict");

            migrationBuilder.DropTable(
                name: "MstStadiumStatus");

            migrationBuilder.DropTable(
                name: "MstStadiumType");

            migrationBuilder.DropTable(
                name: "MstProvince");
        }
    }
}
