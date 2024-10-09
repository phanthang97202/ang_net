using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace API.Migrations
{
    /// <inheritdoc />
    public partial class retreivedb : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Chat",
                columns: table => new
                {
                    UserId = table.Column<string>(type: "TEXT", nullable: false),
                    Message = table.Column<string>(type: "TEXT", nullable: false),
                    CreatedDTime = table.Column<DateTime>(type: "TEXT", nullable: false),
                    ChatModelUserId = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Chat", x => x.UserId);
                    table.ForeignKey(
                        name: "FK_Chat_Chat_ChatModelUserId",
                        column: x => x.ChatModelUserId,
                        principalTable: "Chat",
                        principalColumn: "UserId");
                });

            migrationBuilder.AddPrimaryKey(
                name: "PK_Chat",
                table: "Chat",
                column: "MessageId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {

            migrationBuilder.CreateTable(
                name: "Chat",
                columns: table => new
                {
                    UserId = table.Column<string>(type: "TEXT", nullable: false),
                    Message = table.Column<string>(type: "TEXT", nullable: false),
                    CreatedDTime = table.Column<DateTime>(type: "TEXT", nullable: false),
                    ChatModelUserId = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Chat", x => x.UserId);
                    table.ForeignKey(
                        name: "FK_Chat_Chat_ChatModelUserId",
                        column: x => x.ChatModelUserId,
                        principalTable: "Chat",
                        principalColumn: "UserId");
                }); 
        }
    }
}
