using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace API.Infrastructure.Data.Persistences.Migrations
{
    /// <inheritdoc />
    public partial class ModifyAspIdentityAndAddTenant : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_OrderStadiumStatusLogModel_OrderStadiums_OrderStadiumCode",
                table: "OrderStadiumStatusLogModel");

            migrationBuilder.DropPrimaryKey(
                name: "PK_OrderStadiumStatusLogModel",
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
                newName: "PreviousStatus");

            migrationBuilder.RenameColumn(
                name: "OrderStadiumLogCode",
                table: "OrderStadiumStatusLogModel",
                newName: "OrderId");

            migrationBuilder.AlterColumn<int>(
                name: "OrderId",
                table: "OrderStadiumStatusLogModel",
                type: "integer",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer")
                .OldAnnotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn);

            migrationBuilder.AddColumn<int>(
                name: "OrderStadiumStatusLogId",
                table: "OrderStadiumStatusLogModel",
                type: "integer",
                nullable: false,
                defaultValue: 0)
                .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn);

            migrationBuilder.AddColumn<string>(
                name: "ChangedData",
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

            migrationBuilder.AlterColumn<string>(
                name: "OrderStatus",
                table: "OrderStadiums",
                type: "text",
                nullable: false,
                oldClrType: typeof(bool),
                oldType: "boolean");

            migrationBuilder.AddColumn<int>(
                name: "OrderId",
                table: "OrderStadiums",
                type: "integer",
                nullable: false,
                defaultValue: 0)
                .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn);

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
                name: "VoucherCode",
                table: "OrderStadiums",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "FlagActive",
                table: "LikeNews",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "FlagActive",
                table: "Chat",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedDTime",
                table: "Chat",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedDTime",
                table: "AspNetUsers",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedDTime",
                table: "AspNetUsers",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddPrimaryKey(
                name: "PK_OrderStadiumStatusLogModel",
                table: "OrderStadiumStatusLogModel",
                column: "OrderStadiumStatusLogId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_OrderStadiums",
                table: "OrderStadiums",
                column: "OrderId");

            migrationBuilder.CreateIndex(
                name: "IX_OrderStadiumStatusLogModel_OrderId",
                table: "OrderStadiumStatusLogModel",
                column: "OrderId");

            migrationBuilder.AddForeignKey(
                name: "FK_OrderStadiumStatusLogModel_OrderStadiums_OrderId",
                table: "OrderStadiumStatusLogModel",
                column: "OrderId",
                principalTable: "OrderStadiums",
                principalColumn: "OrderId",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_OrderStadiumStatusLogModel_OrderStadiums_OrderId",
                table: "OrderStadiumStatusLogModel");

            migrationBuilder.DropPrimaryKey(
                name: "PK_OrderStadiumStatusLogModel",
                table: "OrderStadiumStatusLogModel");

            migrationBuilder.DropIndex(
                name: "IX_OrderStadiumStatusLogModel_OrderId",
                table: "OrderStadiumStatusLogModel");

            migrationBuilder.DropPrimaryKey(
                name: "PK_OrderStadiums",
                table: "OrderStadiums");

            migrationBuilder.DropColumn(
                name: "OrderStadiumStatusLogId",
                table: "OrderStadiumStatusLogModel");

            migrationBuilder.DropColumn(
                name: "ChangedData",
                table: "OrderStadiumStatusLogModel");

            migrationBuilder.DropColumn(
                name: "FlagActive",
                table: "OrderStadiumStatusLogModel");

            migrationBuilder.DropColumn(
                name: "IpAddress",
                table: "OrderStadiumStatusLogModel");

            migrationBuilder.DropColumn(
                name: "OrderId",
                table: "OrderStadiums");

            migrationBuilder.DropColumn(
                name: "FlagActive",
                table: "OrderStadiums");

            migrationBuilder.DropColumn(
                name: "RefundMoney",
                table: "OrderStadiums");

            migrationBuilder.DropColumn(
                name: "VoucherCode",
                table: "OrderStadiums");

            migrationBuilder.DropColumn(
                name: "FlagActive",
                table: "LikeNews");

            migrationBuilder.DropColumn(
                name: "FlagActive",
                table: "Chat");

            migrationBuilder.DropColumn(
                name: "UpdatedDTime",
                table: "Chat");

            migrationBuilder.DropColumn(
                name: "CreatedDTime",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "UpdatedDTime",
                table: "AspNetUsers");

            migrationBuilder.RenameColumn(
                name: "PreviousStatus",
                table: "OrderStadiumStatusLogModel",
                newName: "OrderStadiumCode");

            migrationBuilder.RenameColumn(
                name: "OrderId",
                table: "OrderStadiumStatusLogModel",
                newName: "OrderStadiumLogCode");

            migrationBuilder.AlterColumn<int>(
                name: "OrderStadiumLogCode",
                table: "OrderStadiumStatusLogModel",
                type: "integer",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer")
                .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn);

            migrationBuilder.AlterColumn<bool>(
                name: "OrderStatus",
                table: "OrderStadiums",
                type: "boolean",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AddPrimaryKey(
                name: "PK_OrderStadiumStatusLogModel",
                table: "OrderStadiumStatusLogModel",
                column: "OrderStadiumLogCode");

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
