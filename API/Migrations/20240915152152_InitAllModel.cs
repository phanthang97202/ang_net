using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace API.Migrations
{
    /// <inheritdoc />
    public partial class InitAllModel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "MstPaymentTypes",
                columns: table => new
                {
                    PaymentTypeCode = table.Column<string>(type: "TEXT", nullable: false),
                    PaymentTypeName = table.Column<string>(type: "TEXT", nullable: false),
                    FlagActive = table.Column<bool>(type: "INTEGER", nullable: false),
                    CreatedDTime = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedDTime = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MstPaymentTypes", x => x.PaymentTypeCode);
                });

            migrationBuilder.CreateTable(
                name: "MstProvinces",
                columns: table => new
                {
                    ProvinceCode = table.Column<string>(type: "TEXT", nullable: false),
                    ProvinceName = table.Column<string>(type: "TEXT", nullable: false),
                    FlagActive = table.Column<bool>(type: "INTEGER", nullable: false),
                    CreatedDTime = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedDTime = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MstProvinces", x => x.ProvinceCode);
                });

            migrationBuilder.CreateTable(
                name: "MstStadiumStatuses",
                columns: table => new
                {
                    StadiumStatusCode = table.Column<string>(type: "TEXT", nullable: false),
                    StadiumStatusName = table.Column<string>(type: "TEXT", nullable: false),
                    FlagActive = table.Column<bool>(type: "INTEGER", nullable: false),
                    CreatedDTime = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedDTime = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MstStadiumStatuses", x => x.StadiumStatusCode);
                });

            migrationBuilder.CreateTable(
                name: "MstStadiumTypes",
                columns: table => new
                {
                    StadiumTypeCode = table.Column<string>(type: "TEXT", nullable: false),
                    StadiumTypeName = table.Column<string>(type: "TEXT", nullable: false),
                    StadiumTypePrice = table.Column<decimal>(type: "TEXT", nullable: false),
                    StadiumTypeSale = table.Column<decimal>(type: "TEXT", nullable: false),
                    StadiumTypeQuantity = table.Column<int>(type: "INTEGER", nullable: false),
                    FlagActive = table.Column<bool>(type: "INTEGER", nullable: false),
                    CreatedDTime = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedDTime = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MstStadiumTypes", x => x.StadiumTypeCode);
                });

            migrationBuilder.CreateTable(
                name: "MstDistricts",
                columns: table => new
                {
                    ProvinceCode = table.Column<string>(type: "TEXT", nullable: false),
                    DistrictCode = table.Column<string>(type: "TEXT", nullable: false),
                    DistrictName = table.Column<string>(type: "TEXT", nullable: false),
                    FlagActive = table.Column<bool>(type: "INTEGER", nullable: false),
                    CreatedDTime = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedDTime = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MstDistricts", x => x.ProvinceCode);
                    table.ForeignKey(
                        name: "FK_MstDistricts_MstProvinces_ProvinceCode",
                        column: x => x.ProvinceCode,
                        principalTable: "MstProvinces",
                        principalColumn: "ProvinceCode",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "MstStadiums",
                columns: table => new
                {
                    StadiumCode = table.Column<string>(type: "TEXT", maxLength: 250, nullable: false),
                    Id = table.Column<string>(type: "TEXT", nullable: true),
                    StadiumTypeCode = table.Column<string>(type: "TEXT", nullable: false),
                    StadiumStatusCode = table.Column<string>(type: "TEXT", nullable: false),
                    StadiumDistrictCode = table.Column<string>(type: "TEXT", nullable: false),
                    FlagStadiumRent = table.Column<bool>(type: "INTEGER", nullable: false),
                    StadiumRentDTimeFrom = table.Column<DateTime>(type: "TEXT", nullable: false),
                    StadiumRentDTimeTo = table.Column<DateTime>(type: "TEXT", nullable: false),
                    FlagActive = table.Column<bool>(type: "INTEGER", nullable: false),
                    StadiumName = table.Column<string>(type: "TEXT", nullable: false),
                    StadiumPrice = table.Column<decimal>(type: "TEXT", nullable: false),
                    StadiumDescription = table.Column<string>(type: "TEXT", nullable: false),
                    StadiumAddress = table.Column<string>(type: "TEXT", nullable: false),
                    FlagSale = table.Column<bool>(type: "INTEGER", nullable: false),
                    StadiumSalePrice = table.Column<decimal>(type: "TEXT", nullable: false),
                    CreatedDTime = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedDTime = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MstStadiums", x => x.StadiumCode);
                    table.ForeignKey(
                        name: "FK_MstStadiums_MstDistricts_StadiumDistrictCode",
                        column: x => x.StadiumDistrictCode,
                        principalTable: "MstDistricts",
                        principalColumn: "ProvinceCode",
                        onDelete: ReferentialAction.Restrict);
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
                name: "OrderStadiums",
                columns: table => new
                {
                    OrderCode = table.Column<string>(type: "TEXT", nullable: false),
                    OrderId = table.Column<string>(type: "TEXT", nullable: false),
                    StadiumCode = table.Column<string>(type: "TEXT", nullable: false),
                    UserName = table.Column<string>(type: "TEXT", nullable: false),
                    OderDTime = table.Column<DateTime>(type: "TEXT", nullable: false),
                    RentDTimeFrom = table.Column<DateTime>(type: "TEXT", nullable: false),
                    RentDTimeTo = table.Column<DateTime>(type: "TEXT", nullable: false),
                    PaymentTypeCode = table.Column<string>(type: "TEXT", nullable: false),
                    Price = table.Column<decimal>(type: "TEXT", nullable: false),
                    Sale = table.Column<decimal>(type: "TEXT", nullable: false),
                    FlagFinish = table.Column<bool>(type: "INTEGER", nullable: false),
                    Owe = table.Column<decimal>(type: "TEXT", nullable: false),
                    CreatedDTime = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedDTime = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OrderStadiums", x => x.OrderCode);
                    table.ForeignKey(
                        name: "FK_OrderStadiums_AspNetUsers_UserName",
                        column: x => x.UserName,
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

            migrationBuilder.CreateIndex(
                name: "IX_MstStadiums_StadiumDistrictCode",
                table: "MstStadiums",
                column: "StadiumDistrictCode");

            migrationBuilder.CreateIndex(
                name: "IX_MstStadiums_StadiumStatusCode",
                table: "MstStadiums",
                column: "StadiumStatusCode");

            migrationBuilder.CreateIndex(
                name: "IX_MstStadiums_StadiumTypeCode",
                table: "MstStadiums",
                column: "StadiumTypeCode");

            migrationBuilder.CreateIndex(
                name: "IX_OrderStadiums_PaymentTypeCode",
                table: "OrderStadiums",
                column: "PaymentTypeCode");

            migrationBuilder.CreateIndex(
                name: "IX_OrderStadiums_StadiumCode",
                table: "OrderStadiums",
                column: "StadiumCode");

            migrationBuilder.CreateIndex(
                name: "IX_OrderStadiums_UserName",
                table: "OrderStadiums",
                column: "UserName");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "OrderStadiums");

            migrationBuilder.DropTable(
                name: "MstPaymentTypes");

            migrationBuilder.DropTable(
                name: "MstStadiums");

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
