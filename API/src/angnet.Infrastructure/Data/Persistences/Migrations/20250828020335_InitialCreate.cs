using System;
using System.Text.Json;
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
                name: "MstPaymentTypes",
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
                    table.PrimaryKey("PK_MstPaymentTypes", x => x.PaymentTypeCode);
                });

            migrationBuilder.CreateTable(
                name: "MstProvinces",
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
                    table.PrimaryKey("PK_MstProvinces", x => x.ProvinceCode);
                });

            migrationBuilder.CreateTable(
                name: "MstStadiumStatuses",
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
                    table.PrimaryKey("PK_MstStadiumStatuses", x => x.StadiumStatusCode);
                });

            migrationBuilder.CreateTable(
                name: "MstStadiumTypes",
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
                    table.PrimaryKey("PK_MstStadiumTypes", x => x.StadiumTypeCode);
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
                name: "Tenants",
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
                    TenantAddress = table.Column<JsonDocument>(type: "jsonb", nullable: false),
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
                    table.PrimaryKey("PK_Tenants", x => x.TenantId);
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
                name: "RefreshTokens",
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
                    table.PrimaryKey("PK_RefreshTokens", x => x.RefreshToken);
                    table.ForeignKey(
                        name: "FK_RefreshTokens_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "MstDistricts",
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
                    table.PrimaryKey("PK_MstDistricts", x => x.DistrictCode);
                    table.ForeignKey(
                        name: "FK_MstDistricts_MstProvinces_ProvinceCode",
                        column: x => x.ProvinceCode,
                        principalTable: "MstProvinces",
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
                name: "MstTenantContacts",
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
                    table.PrimaryKey("PK_MstTenantContacts", x => x.TenantContactId);
                    table.ForeignKey(
                        name: "FK_MstTenantContacts_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "TenantId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MstStadiums",
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
                    table.PrimaryKey("PK_MstStadiums", x => x.StadiumCode);
                    table.ForeignKey(
                        name: "FK_MstStadiums_MstDistricts_DistrictCode",
                        column: x => x.DistrictCode,
                        principalTable: "MstDistricts",
                        principalColumn: "DistrictCode",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MstStadiums_MstStadiumStatuses_StadiumStatusCode",
                        column: x => x.StadiumStatusCode,
                        principalTable: "MstStadiumStatuses",
                        principalColumn: "StadiumStatusCode",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_MstStadiums_MstStadiumTypes_StadiumTypeCode",
                        column: x => x.StadiumTypeCode,
                        principalTable: "MstStadiumTypes",
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
                        name: "FK_MstStadiumFileModel_MstStadiums_StadiumCode",
                        column: x => x.StadiumCode,
                        principalTable: "MstStadiums",
                        principalColumn: "StadiumCode",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "OrderStadiums",
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
                    table.PrimaryKey("PK_OrderStadiums", x => x.OrderStadiumId);
                    table.ForeignKey(
                        name: "FK_OrderStadiums_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_OrderStadiums_MstPaymentTypes_PaymentTypeCode",
                        column: x => x.PaymentTypeCode,
                        principalTable: "MstPaymentTypes",
                        principalColumn: "PaymentTypeCode",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_OrderStadiums_MstStadiums_StadiumCode",
                        column: x => x.StadiumCode,
                        principalTable: "MstStadiums",
                        principalColumn: "StadiumCode",
                        onDelete: ReferentialAction.Restrict);
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
                        name: "FK_OrderStadiumStatusLogModel_OrderStadiums_OrderStadiumId",
                        column: x => x.OrderStadiumId,
                        principalTable: "OrderStadiums",
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
                name: "IX_MstDistricts_ProvinceCode",
                table: "MstDistricts",
                column: "ProvinceCode");

            migrationBuilder.CreateIndex(
                name: "IX_MstStadiumFileModel_StadiumCode",
                table: "MstStadiumFileModel",
                column: "StadiumCode");

            migrationBuilder.CreateIndex(
                name: "IX_MstStadiums_DistrictCode",
                table: "MstStadiums",
                column: "DistrictCode");

            migrationBuilder.CreateIndex(
                name: "IX_MstStadiums_StadiumStatusCode",
                table: "MstStadiums",
                column: "StadiumStatusCode");

            migrationBuilder.CreateIndex(
                name: "IX_MstStadiums_StadiumTypeCode",
                table: "MstStadiums",
                column: "StadiumTypeCode");

            migrationBuilder.CreateIndex(
                name: "IX_MstTenantContacts_TenantId",
                table: "MstTenantContacts",
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
                name: "IX_OrderStadiums_PaymentTypeCode",
                table: "OrderStadiums",
                column: "PaymentTypeCode");

            migrationBuilder.CreateIndex(
                name: "IX_OrderStadiums_StadiumCode",
                table: "OrderStadiums",
                column: "StadiumCode");

            migrationBuilder.CreateIndex(
                name: "IX_OrderStadiums_UserId",
                table: "OrderStadiums",
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
                name: "IX_RefreshTokens_UserId",
                table: "RefreshTokens",
                column: "UserId");
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
                name: "HashTagNews");

            migrationBuilder.DropTable(
                name: "LikeNews");

            migrationBuilder.DropTable(
                name: "MstStadiumFileModel");

            migrationBuilder.DropTable(
                name: "MstTenantContacts");

            migrationBuilder.DropTable(
                name: "OrderStadiumStatusLogModel");

            migrationBuilder.DropTable(
                name: "PointNews");

            migrationBuilder.DropTable(
                name: "RefFileNews");

            migrationBuilder.DropTable(
                name: "RefreshTokens");

            migrationBuilder.DropTable(
                name: "AspNetRoles");

            migrationBuilder.DropTable(
                name: "Tenants");

            migrationBuilder.DropTable(
                name: "OrderStadiums");

            migrationBuilder.DropTable(
                name: "News");

            migrationBuilder.DropTable(
                name: "MstPaymentTypes");

            migrationBuilder.DropTable(
                name: "MstStadiums");

            migrationBuilder.DropTable(
                name: "AspNetUsers");

            migrationBuilder.DropTable(
                name: "NewsCategory");

            migrationBuilder.DropTable(
                name: "MstDistricts");

            migrationBuilder.DropTable(
                name: "MstStadiumStatuses");

            migrationBuilder.DropTable(
                name: "MstStadiumTypes");

            migrationBuilder.DropTable(
                name: "MstProvinces");
        }
    }
}
