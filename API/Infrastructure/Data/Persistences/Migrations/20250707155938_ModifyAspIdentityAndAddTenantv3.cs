using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace API.Infrastructure.Data.Persistences.Migrations
{
    /// <inheritdoc />
    public partial class ModifyAspIdentityAndAddTenantv3 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            //migrationBuilder.DropForeignKey(
            //    name: "FK_OrderStadiumStatusLogModel_OrderStadiums_OrderStadiumId",
            //    table: "OrderStadiumStatusLogModel");

            //migrationBuilder.DropUniqueConstraint(
            //    name: "AK_OrderStadiums_TempId",
            //    table: "OrderStadiums");

            //migrationBuilder.DropColumn(
            //    name: "TempId",
            //    table: "OrderStadiums");

            //migrationBuilder.AlterColumn<int>(
            //    name: "TenantId",
            //    table: "Tenants",
            //    type: "integer",
            //    nullable: false,
            //    oldClrType: typeof(string),
            //    oldType: "text")
            //    .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn);

            //migrationBuilder.AlterColumn<string>(
            //    name: "Status",
            //    table: "OrderStadiumStatusLogModel",
            //    type: "text",
            //    nullable: false,
            //    oldClrType: typeof(string),
            //    oldType: "varchar(20)");

            //migrationBuilder.AlterColumn<int>(
            //    name: "OrderStadiumId",
            //    table: "OrderStadiums",
            //    type: "integer",
            //    nullable: false,
            //    oldClrType: typeof(string),
            //    oldType: "text")
            //    .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn);

            //migrationBuilder.AlterColumn<int>(
            //    name: "TenantId",
            //    table: "MstTenantContacts",
            //    type: "integer",
            //    nullable: false,
            //    oldClrType: typeof(string),
            //    oldType: "text");

            //migrationBuilder.AddColumn<string>(
            //    name: "UpdatedBy",
            //    table: "Chat",
            //    type: "text",
            //    nullable: false,
            //    defaultValue: "");

            //migrationBuilder.AddForeignKey(
            //    name: "FK_OrderStadiumStatusLogModel_OrderStadiums_OrderStadiumId",
            //    table: "OrderStadiumStatusLogModel",
            //    column: "OrderStadiumId",
            //    principalTable: "OrderStadiums",
            //    principalColumn: "OrderStadiumId",
            //    onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            //migrationBuilder.DropForeignKey(
            //    name: "FK_OrderStadiumStatusLogModel_OrderStadiums_OrderStadiumId",
            //    table: "OrderStadiumStatusLogModel");

            migrationBuilder.DropColumn(
                name: "UpdatedBy",
                table: "Chat");

            //migrationBuilder.AlterColumn<string>(
            //    name: "TenantId",
            //    table: "Tenants",
            //    type: "text",
            //    nullable: false,
            //    oldClrType: typeof(int),
            //    oldType: "integer")
            //    .OldAnnotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn);

            //migrationBuilder.AlterColumn<string>(
            //    name: "Status",
            //    table: "OrderStadiumStatusLogModel",
            //    type: "varchar(20)",
            //    nullable: false,
            //    oldClrType: typeof(string),
            //    oldType: "text");

            //migrationBuilder.AlterColumn<string>(
            //    name: "OrderStadiumId",
            //    table: "OrderStadiums",
            //    type: "text",
            //    nullable: false,
            //    oldClrType: typeof(int),
            //    oldType: "integer")
            //    .OldAnnotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn);

            //migrationBuilder.AddColumn<int>(
            //    name: "TempId",
            //    table: "OrderStadiums",
            //    type: "integer",
            //    nullable: false,
            //    defaultValue: 0);

            //migrationBuilder.AlterColumn<string>(
            //    name: "TenantId",
            //    table: "MstTenantContacts",
            //    type: "text",
            //    nullable: false,
            //    oldClrType: typeof(int),
            //    oldType: "integer");

            //migrationBuilder.AddUniqueConstraint(
            //    name: "AK_OrderStadiums_TempId",
            //    table: "OrderStadiums",
            //    column: "TempId");

            //migrationBuilder.AddForeignKey(
            //    name: "FK_OrderStadiumStatusLogModel_OrderStadiums_OrderStadiumId",
            //    table: "OrderStadiumStatusLogModel",
            //    column: "OrderStadiumId",
            //    principalTable: "OrderStadiums",
            //    principalColumn: "TempId",
            //    onDelete: ReferentialAction.Restrict);
        }
    }
}
