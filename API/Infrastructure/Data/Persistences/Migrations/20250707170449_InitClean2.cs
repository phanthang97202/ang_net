using System;
using System.Text.Json;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace API.Infrastructure.Data.Persistences.Migrations
{
    /// <inheritdoc />
    public partial class InitClean2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedDTime",
                table: "AspNetUsers",
                type: "timestamp with time zone",
                nullable: false,
                defaultValueSql: "CURRENT_TIMESTAMP");

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedDTime",
                table: "AspNetUsers",
                type: "timestamp with time zone",
                nullable: false,
                defaultValueSql: "CURRENT_TIMESTAMP");

            migrationBuilder.AddColumn<string>(
                name: "CreatedBy",
                table: "AspNetUsers",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "UpdatedBy",
                table: "AspNetUsers",
                type: "text",
                nullable: false,
                defaultValue: "");
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
