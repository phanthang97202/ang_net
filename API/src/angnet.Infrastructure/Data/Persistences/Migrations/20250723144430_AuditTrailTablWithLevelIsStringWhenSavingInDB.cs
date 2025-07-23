using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace angnet.Infrastructure.Data.Persistences.Migrations
{
    /// <inheritdoc />
    public partial class AuditTrailTablWithLevelIsStringWhenSavingInDB : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Level",
                table: "AuditTrail",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Level",
                table: "AuditTrail");
        }
    }
}
