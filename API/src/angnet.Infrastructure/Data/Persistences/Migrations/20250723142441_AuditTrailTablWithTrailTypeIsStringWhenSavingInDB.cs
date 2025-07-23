using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace angnet.Infrastructure.Data.Persistences.Migrations
{
    /// <inheritdoc />
    public partial class AuditTrailTablWithTrailTypeIsStringWhenSavingInDB : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "TrailType",
                table: "AuditTrail",
                type: "text",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<int>(
                name: "TrailType",
                table: "AuditTrail",
                type: "integer",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");
        }
    }
}
