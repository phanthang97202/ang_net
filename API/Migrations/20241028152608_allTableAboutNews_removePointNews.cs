using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace API.Migrations
{
    /// <inheritdoc />
    public partial class allTableAboutNews_removePointNews : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PointNews_AspNetUsers_AppUserId",
                table: "PointNews");

            migrationBuilder.DropForeignKey(
                name: "FK_PointNews_News_NewsId1",
                table: "PointNews");

            migrationBuilder.DropIndex(
                name: "IX_PointNews_AppUserId",
                table: "PointNews");

            migrationBuilder.DropIndex(
                name: "IX_PointNews_NewsId1",
                table: "PointNews");

            migrationBuilder.DropColumn(
                name: "AppUserId",
                table: "PointNews");

            migrationBuilder.DropColumn(
                name: "NewsId1",
                table: "PointNews");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AppUserId",
                table: "PointNews",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "NewsId1",
                table: "PointNews",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_PointNews_AppUserId",
                table: "PointNews",
                column: "AppUserId");

            migrationBuilder.CreateIndex(
                name: "IX_PointNews_NewsId1",
                table: "PointNews",
                column: "NewsId1");

            migrationBuilder.AddForeignKey(
                name: "FK_PointNews_AspNetUsers_AppUserId",
                table: "PointNews",
                column: "AppUserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_PointNews_News_NewsId1",
                table: "PointNews",
                column: "NewsId1",
                principalTable: "News",
                principalColumn: "NewsId",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
