using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace API.Migrations
{
    /// <inheritdoc />
    public partial class refactordatabaseaboutorderstadium : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "StadiumTypeQuantity",
                table: "MstStadiumTypes");

            migrationBuilder.DropColumn(
                name: "FlagSale",
                table: "MstStadiums");

            migrationBuilder.DropColumn(
                name: "StadiumRentDTimeFrom",
                table: "MstStadiums");

            migrationBuilder.RenameColumn(
                name: "Sale",
                table: "OrderStadiums",
                newName: "SalePercent");

            migrationBuilder.RenameColumn(
                name: "PrePrice",
                table: "OrderStadiums",
                newName: "Remark");

            migrationBuilder.RenameColumn(
                name: "FlagFinish",
                table: "OrderStadiums",
                newName: "IsCancel");

            migrationBuilder.RenameColumn(
                name: "StadiumTypeSale",
                table: "MstStadiumTypes",
                newName: "StadiumTypeSalePercent");

            migrationBuilder.RenameColumn(
                name: "StadiumTypePrice",
                table: "MstStadiumTypes",
                newName: "Remark");

            migrationBuilder.RenameColumn(
                name: "StadiumSalePrice",
                table: "MstStadiums",
                newName: "StadiumSalePercent");

            migrationBuilder.RenameColumn(
                name: "StadiumRentDTimeTo",
                table: "MstStadiums",
                newName: "Remark");

            migrationBuilder.AddColumn<bool>(
                name: "InDebt",
                table: "OrderStadiums",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<decimal>(
                name: "PreMoney",
                table: "OrderStadiums",
                type: "TEXT",
                nullable: false,
                defaultValue: 0m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "InDebt",
                table: "OrderStadiums");

            migrationBuilder.DropColumn(
                name: "PreMoney",
                table: "OrderStadiums");

            migrationBuilder.RenameColumn(
                name: "SalePercent",
                table: "OrderStadiums",
                newName: "Sale");

            migrationBuilder.RenameColumn(
                name: "Remark",
                table: "OrderStadiums",
                newName: "PrePrice");

            migrationBuilder.RenameColumn(
                name: "IsCancel",
                table: "OrderStadiums",
                newName: "FlagFinish");

            migrationBuilder.RenameColumn(
                name: "StadiumTypeSalePercent",
                table: "MstStadiumTypes",
                newName: "StadiumTypeSale");

            migrationBuilder.RenameColumn(
                name: "Remark",
                table: "MstStadiumTypes",
                newName: "StadiumTypePrice");

            migrationBuilder.RenameColumn(
                name: "StadiumSalePercent",
                table: "MstStadiums",
                newName: "StadiumSalePrice");

            migrationBuilder.RenameColumn(
                name: "Remark",
                table: "MstStadiums",
                newName: "StadiumRentDTimeTo");

            migrationBuilder.AddColumn<int>(
                name: "StadiumTypeQuantity",
                table: "MstStadiumTypes",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<bool>(
                name: "FlagSale",
                table: "MstStadiums",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "StadiumRentDTimeFrom",
                table: "MstStadiums",
                type: "TEXT",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));
        }
    }
}
