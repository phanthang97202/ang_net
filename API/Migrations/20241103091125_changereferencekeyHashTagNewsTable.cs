using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace API.Migrations
{
    /// <inheritdoc />
    public partial class changereferencekeyHashTagNewsTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropPrimaryKey(
                name: "PK_HashTagNews",
                table: "HashTagNews");

            migrationBuilder.AlterColumn<string>(
                name: "NewsId",
                table: "HashTagNews",
                type: "TEXT",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "TEXT",
                oldNullable: true);

            migrationBuilder.AddPrimaryKey(
                name: "PK_HashTagNews",
                table: "HashTagNews",
                columns: new[] { "HashTagNewsId", "NewsId" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropPrimaryKey(
                name: "PK_HashTagNews",
                table: "HashTagNews");

            migrationBuilder.AlterColumn<string>(
                name: "NewsId",
                table: "HashTagNews",
                type: "TEXT",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "TEXT");

            migrationBuilder.AddPrimaryKey(
                name: "PK_HashTagNews",
                table: "HashTagNews",
                column: "HashTagNewsId");
        }
    }
}
