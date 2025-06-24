using System;
using System.Text.Json;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace API.Infrastructure.Data.Persistences.Migrations
{
    /// <inheritdoc />
    public partial class MultiTenancyForApp : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_OrderStadiumStatusLogModel_OrderStadiums_OrderStadiumCode",
                table: "OrderStadiumStatusLogModel");

            migrationBuilder.DropIndex(
                name: "IX_OrderStadiumStatusLogModel_OrderStadiumCode",
                table: "OrderStadiumStatusLogModel");

            migrationBuilder.DropPrimaryKey(
                name: "PK_OrderStadiums",
                table: "OrderStadiums");

            migrationBuilder.RenameColumn(
                name: "OrderStadiumCode",
                table: "OrderStadiumStatusLogModel",
                newName: "UpdatedBy");

            migrationBuilder.RenameColumn(
                name: "OrderStadiumLogCode",
                table: "OrderStadiumStatusLogModel",
                newName: "OrderStadiumStatusLogId");

            migrationBuilder.AddColumn<string>(
                name: "CreatedBy",
                table: "RefreshTokens",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedDTime",
                table: "RefreshTokens",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<bool>(
                name: "FlagActive",
                table: "RefreshTokens",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "TenantId",
                table: "RefreshTokens",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "UpdatedBy",
                table: "RefreshTokens",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedDTime",
                table: "RefreshTokens",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "CreatedBy",
                table: "RefFileNews",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "UpdatedBy",
                table: "RefFileNews",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "CreatedBy",
                table: "PointNews",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "UpdatedBy",
                table: "PointNews",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "OrderStadiumStatusLogModel",
                type: "varchar(20)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AddColumn<string>(
                name: "ChangedData",
                table: "OrderStadiumStatusLogModel",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "CreatedBy",
                table: "OrderStadiumStatusLogModel",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "FlagActive",
                table: "OrderStadiumStatusLogModel",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "IpAddress",
                table: "OrderStadiumStatusLogModel",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "OrderStadiumId",
                table: "OrderStadiumStatusLogModel",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "PreviousStatus",
                table: "OrderStadiumStatusLogModel",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AlterColumn<string>(
                name: "OrderStatus",
                table: "OrderStadiums",
                type: "varchar(20)",
                nullable: false,
                oldClrType: typeof(bool),
                oldType: "boolean");

            migrationBuilder.AddColumn<string>(
                name: "OrderStadiumId",
                table: "OrderStadiums",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "CreatedBy",
                table: "OrderStadiums",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "FlagActive",
                table: "OrderStadiums",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<decimal>(
                name: "RefundMoney",
                table: "OrderStadiums",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "UpdatedBy",
                table: "OrderStadiums",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "VoucherCode",
                table: "OrderStadiums",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "CreatedBy",
                table: "NewsCategory",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "IsGlobal",
                table: "NewsCategory",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "TenantId",
                table: "NewsCategory",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "UpdatedBy",
                table: "NewsCategory",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "CreatedBy",
                table: "News",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "UpdatedBy",
                table: "News",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "WhoCanSee",
                table: "News",
                type: "varchar(20)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "CreatedBy",
                table: "MstStadiumTypes",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "UpdatedBy",
                table: "MstStadiumTypes",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "CreatedBy",
                table: "MstStadiumStatuses",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "UpdatedBy",
                table: "MstStadiumStatuses",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "CreatedBy",
                table: "MstStadiums",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "TenantId",
                table: "MstStadiums",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "UpdatedBy",
                table: "MstStadiums",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "CreatedBy",
                table: "MstStadiumFileModel",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "UpdatedBy",
                table: "MstStadiumFileModel",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "CreatedBy",
                table: "MstProvinces",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "TenantId",
                table: "MstProvinces",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "UpdatedBy",
                table: "MstProvinces",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "CreatedBy",
                table: "MstPaymentTypes",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "UpdatedBy",
                table: "MstPaymentTypes",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "CreatedBy",
                table: "MstDistricts",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "UpdatedBy",
                table: "MstDistricts",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "CreatedBy",
                table: "LikeNews",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "FlagActive",
                table: "LikeNews",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "UpdatedBy",
                table: "LikeNews",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "CreatedBy",
                table: "HashTagNews",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "UpdatedBy",
                table: "HashTagNews",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "CreatedBy",
                table: "Chat",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "FlagActive",
                table: "Chat",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "UpdatedBy",
                table: "Chat",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedDTime",
                table: "Chat",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<int>(
                name: "TenantId",
                table: "AspNetUsers",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddPrimaryKey(
                name: "PK_OrderStadiums",
                table: "OrderStadiums",
                column: "OrderStadiumId");

            migrationBuilder.CreateTable(
                name: "Tenants",
                columns: table => new
                {
                    TenantId = table.Column<string>(type: "text", nullable: false),
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
                name: "MstTenantContacts",
                columns: table => new
                {
                    TenantContactId = table.Column<string>(type: "text", nullable: false),
                    TenantId = table.Column<string>(type: "text", nullable: false),
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

            migrationBuilder.CreateIndex(
                name: "IX_OrderStadiumStatusLogModel_OrderStadiumId",
                table: "OrderStadiumStatusLogModel",
                column: "OrderStadiumId");

            migrationBuilder.CreateIndex(
                name: "IX_MstTenantContacts_TenantId",
                table: "MstTenantContacts",
                column: "TenantId");

            migrationBuilder.AddForeignKey(
                name: "FK_OrderStadiumStatusLogModel_OrderStadiums_OrderStadiumId",
                table: "OrderStadiumStatusLogModel",
                column: "OrderStadiumId",
                principalTable: "OrderStadiums",
                principalColumn: "OrderStadiumId",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_OrderStadiumStatusLogModel_OrderStadiums_OrderStadiumId",
                table: "OrderStadiumStatusLogModel");

            migrationBuilder.DropTable(
                name: "MstTenantContacts");

            migrationBuilder.DropTable(
                name: "Tenants");

            migrationBuilder.DropIndex(
                name: "IX_OrderStadiumStatusLogModel_OrderStadiumId",
                table: "OrderStadiumStatusLogModel");

            migrationBuilder.DropPrimaryKey(
                name: "PK_OrderStadiums",
                table: "OrderStadiums");

            migrationBuilder.DropColumn(
                name: "CreatedBy",
                table: "RefreshTokens");

            migrationBuilder.DropColumn(
                name: "CreatedDTime",
                table: "RefreshTokens");

            migrationBuilder.DropColumn(
                name: "FlagActive",
                table: "RefreshTokens");

            migrationBuilder.DropColumn(
                name: "TenantId",
                table: "RefreshTokens");

            migrationBuilder.DropColumn(
                name: "UpdatedBy",
                table: "RefreshTokens");

            migrationBuilder.DropColumn(
                name: "UpdatedDTime",
                table: "RefreshTokens");

            migrationBuilder.DropColumn(
                name: "CreatedBy",
                table: "RefFileNews");

            migrationBuilder.DropColumn(
                name: "UpdatedBy",
                table: "RefFileNews");

            migrationBuilder.DropColumn(
                name: "CreatedBy",
                table: "PointNews");

            migrationBuilder.DropColumn(
                name: "UpdatedBy",
                table: "PointNews");

            migrationBuilder.DropColumn(
                name: "ChangedData",
                table: "OrderStadiumStatusLogModel");

            migrationBuilder.DropColumn(
                name: "CreatedBy",
                table: "OrderStadiumStatusLogModel");

            migrationBuilder.DropColumn(
                name: "FlagActive",
                table: "OrderStadiumStatusLogModel");

            migrationBuilder.DropColumn(
                name: "IpAddress",
                table: "OrderStadiumStatusLogModel");

            migrationBuilder.DropColumn(
                name: "OrderStadiumId",
                table: "OrderStadiumStatusLogModel");

            migrationBuilder.DropColumn(
                name: "PreviousStatus",
                table: "OrderStadiumStatusLogModel");

            migrationBuilder.DropColumn(
                name: "OrderStadiumId",
                table: "OrderStadiums");

            migrationBuilder.DropColumn(
                name: "CreatedBy",
                table: "OrderStadiums");

            migrationBuilder.DropColumn(
                name: "FlagActive",
                table: "OrderStadiums");

            migrationBuilder.DropColumn(
                name: "RefundMoney",
                table: "OrderStadiums");

            migrationBuilder.DropColumn(
                name: "UpdatedBy",
                table: "OrderStadiums");

            migrationBuilder.DropColumn(
                name: "VoucherCode",
                table: "OrderStadiums");

            migrationBuilder.DropColumn(
                name: "CreatedBy",
                table: "NewsCategory");

            migrationBuilder.DropColumn(
                name: "IsGlobal",
                table: "NewsCategory");

            migrationBuilder.DropColumn(
                name: "TenantId",
                table: "NewsCategory");

            migrationBuilder.DropColumn(
                name: "UpdatedBy",
                table: "NewsCategory");

            migrationBuilder.DropColumn(
                name: "CreatedBy",
                table: "News");

            migrationBuilder.DropColumn(
                name: "UpdatedBy",
                table: "News");

            migrationBuilder.DropColumn(
                name: "WhoCanSee",
                table: "News");

            migrationBuilder.DropColumn(
                name: "CreatedBy",
                table: "MstStadiumTypes");

            migrationBuilder.DropColumn(
                name: "UpdatedBy",
                table: "MstStadiumTypes");

            migrationBuilder.DropColumn(
                name: "CreatedBy",
                table: "MstStadiumStatuses");

            migrationBuilder.DropColumn(
                name: "UpdatedBy",
                table: "MstStadiumStatuses");

            migrationBuilder.DropColumn(
                name: "CreatedBy",
                table: "MstStadiums");

            migrationBuilder.DropColumn(
                name: "TenantId",
                table: "MstStadiums");

            migrationBuilder.DropColumn(
                name: "UpdatedBy",
                table: "MstStadiums");

            migrationBuilder.DropColumn(
                name: "CreatedBy",
                table: "MstStadiumFileModel");

            migrationBuilder.DropColumn(
                name: "UpdatedBy",
                table: "MstStadiumFileModel");

            migrationBuilder.DropColumn(
                name: "CreatedBy",
                table: "MstProvinces");

            migrationBuilder.DropColumn(
                name: "TenantId",
                table: "MstProvinces");

            migrationBuilder.DropColumn(
                name: "UpdatedBy",
                table: "MstProvinces");

            migrationBuilder.DropColumn(
                name: "CreatedBy",
                table: "MstPaymentTypes");

            migrationBuilder.DropColumn(
                name: "UpdatedBy",
                table: "MstPaymentTypes");

            migrationBuilder.DropColumn(
                name: "CreatedBy",
                table: "MstDistricts");

            migrationBuilder.DropColumn(
                name: "UpdatedBy",
                table: "MstDistricts");

            migrationBuilder.DropColumn(
                name: "CreatedBy",
                table: "LikeNews");

            migrationBuilder.DropColumn(
                name: "FlagActive",
                table: "LikeNews");

            migrationBuilder.DropColumn(
                name: "UpdatedBy",
                table: "LikeNews");

            migrationBuilder.DropColumn(
                name: "CreatedBy",
                table: "HashTagNews");

            migrationBuilder.DropColumn(
                name: "UpdatedBy",
                table: "HashTagNews");

            migrationBuilder.DropColumn(
                name: "CreatedBy",
                table: "Chat");

            migrationBuilder.DropColumn(
                name: "FlagActive",
                table: "Chat");

            migrationBuilder.DropColumn(
                name: "UpdatedBy",
                table: "Chat");

            migrationBuilder.DropColumn(
                name: "UpdatedDTime",
                table: "Chat");

            migrationBuilder.DropColumn(
                name: "TenantId",
                table: "AspNetUsers");

            migrationBuilder.RenameColumn(
                name: "UpdatedBy",
                table: "OrderStadiumStatusLogModel",
                newName: "OrderStadiumCode");

            migrationBuilder.RenameColumn(
                name: "OrderStadiumStatusLogId",
                table: "OrderStadiumStatusLogModel",
                newName: "OrderStadiumLogCode");

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "OrderStadiumStatusLogModel",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "varchar(20)");

            migrationBuilder.AlterColumn<bool>(
                name: "OrderStatus",
                table: "OrderStadiums",
                type: "boolean",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "varchar(20)");

            migrationBuilder.AddPrimaryKey(
                name: "PK_OrderStadiums",
                table: "OrderStadiums",
                column: "OrderStadiumCode");

            migrationBuilder.CreateIndex(
                name: "IX_OrderStadiumStatusLogModel_OrderStadiumCode",
                table: "OrderStadiumStatusLogModel",
                column: "OrderStadiumCode");

            migrationBuilder.AddForeignKey(
                name: "FK_OrderStadiumStatusLogModel_OrderStadiums_OrderStadiumCode",
                table: "OrderStadiumStatusLogModel",
                column: "OrderStadiumCode",
                principalTable: "OrderStadiums",
                principalColumn: "OrderStadiumCode",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
