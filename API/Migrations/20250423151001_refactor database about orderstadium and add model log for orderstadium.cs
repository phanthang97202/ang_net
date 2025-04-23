using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace API.Migrations
{
    /// <inheritdoc />
    public partial class refactordatabaseaboutorderstadiumandaddmodellogfororderstadium : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "InDebt",
                table: "OrderStadiums");

            migrationBuilder.RenameColumn(
                name: "IsCancel",
                table: "OrderStadiums",
                newName: "OrderStatus");

            migrationBuilder.AddColumn<decimal>(
                name: "DebtMoney",
                table: "OrderStadiums",
                type: "TEXT",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.CreateTable(
                name: "OrderStadiumStatusLogModel",
                columns: table => new
                {
                    OrderStadiumLogCode = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    OrderStadiumCode = table.Column<string>(type: "TEXT", nullable: false),
                    UserId = table.Column<string>(type: "TEXT", nullable: false),
                    Status = table.Column<string>(type: "TEXT", nullable: false),
                    Note = table.Column<string>(type: "TEXT", nullable: false),
                    CreatedDTime = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedDTime = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OrderStadiumStatusLogModel", x => x.OrderStadiumLogCode);
                    table.ForeignKey(
                        name: "FK_OrderStadiumStatusLogModel_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_OrderStadiumStatusLogModel_OrderStadiums_OrderStadiumCode",
                        column: x => x.OrderStadiumCode,
                        principalTable: "OrderStadiums",
                        principalColumn: "OrderStadiumCode",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_OrderStadiumStatusLogModel_OrderStadiumCode",
                table: "OrderStadiumStatusLogModel",
                column: "OrderStadiumCode");

            migrationBuilder.CreateIndex(
                name: "IX_OrderStadiumStatusLogModel_UserId",
                table: "OrderStadiumStatusLogModel",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "OrderStadiumStatusLogModel");

            migrationBuilder.DropColumn(
                name: "DebtMoney",
                table: "OrderStadiums");

            migrationBuilder.RenameColumn(
                name: "OrderStatus",
                table: "OrderStadiums",
                newName: "IsCancel");

            migrationBuilder.AddColumn<bool>(
                name: "InDebt",
                table: "OrderStadiums",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);
        }
    }
}
