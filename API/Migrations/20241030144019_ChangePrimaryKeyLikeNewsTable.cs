using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace API.Migrations
{
    /// <inheritdoc />
    public partial class ChangePrimaryKeyLikeNewsTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropPrimaryKey(
                name: "PK_LikeNews",
                table: "LikeNews");

            migrationBuilder.AddColumn<string>(
                name: "LikeNewsId",
                table: "LikeNews",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddPrimaryKey(
                name: "PK_LikeNews",
                table: "LikeNews",
                column: "LikeNewsId");

            migrationBuilder.CreateIndex(
                name: "IX_LikeNews_NewsId",
                table: "LikeNews",
                column: "NewsId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropPrimaryKey(
                name: "PK_LikeNews",
                table: "LikeNews");

            migrationBuilder.DropIndex(
                name: "IX_LikeNews_NewsId",
                table: "LikeNews");

            migrationBuilder.DropColumn(
                name: "LikeNewsId",
                table: "LikeNews");

            migrationBuilder.AddPrimaryKey(
                name: "PK_LikeNews",
                table: "LikeNews",
                columns: new[] { "NewsId", "UserId" });
        }
    }
}
