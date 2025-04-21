using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace API.Migrations
{
    /// <inheritdoc />
    public partial class add_stadiumfilemodel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "MstStadiumFileModel",
                columns: table => new
                {
                    StadiumFileId = table.Column<string>(type: "TEXT", nullable: false),
                    StadiumCode = table.Column<string>(type: "TEXT", nullable: false),
                    FileUrl = table.Column<string>(type: "TEXT", nullable: false),
                    FlagActive = table.Column<bool>(type: "INTEGER", nullable: false),
                    CreatedDTime = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedDTime = table.Column<DateTime>(type: "TEXT", nullable: false)
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

            migrationBuilder.CreateIndex(
                name: "IX_MstStadiumFileModel_StadiumCode",
                table: "MstStadiumFileModel",
                column: "StadiumCode");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "MstStadiumFileModel");
        }
    }
}
