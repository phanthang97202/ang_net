using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace angnet.Infrastructure.Data.Persistences.Migrations
{
    /// <inheritdoc />
    public partial class AlterTableGenerationAuthCode : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "AttemptCount",
                table: "GenerationAuthCode",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "Salt",
                table: "GenerationAuthCode",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AttemptCount",
                table: "GenerationAuthCode");

            migrationBuilder.DropColumn(
                name: "Salt",
                table: "GenerationAuthCode");
        }
    }
}
