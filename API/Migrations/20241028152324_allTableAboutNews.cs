using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace API.Migrations
{
    /// <inheritdoc />
    public partial class allTableAboutNews : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "NewsCategory",
                columns: table => new
                {
                    NewsCategoryId = table.Column<string>(type: "TEXT", nullable: false),
                    NewsCategoryParentId = table.Column<string>(type: "TEXT", nullable: false),
                    NewsCategoryName = table.Column<string>(type: "TEXT", nullable: false),
                    NewsCategoryIndex = table.Column<int>(type: "INTEGER", nullable: false),
                    FlagActive = table.Column<bool>(type: "INTEGER", nullable: false),
                    CreatedDTime = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedDTime = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NewsCategory", x => x.NewsCategoryId);
                });

            migrationBuilder.CreateTable(
                name: "News",
                columns: table => new
                {
                    NewsId = table.Column<string>(type: "TEXT", nullable: false),
                    UserId = table.Column<string>(type: "TEXT", nullable: false),
                    CategoryNewsId = table.Column<string>(type: "TEXT", nullable: false),
                    Slug = table.Column<string>(type: "TEXT", nullable: false),
                    Thumbnail = table.Column<string>(type: "TEXT", nullable: false),
                    ShortTitle = table.Column<string>(type: "TEXT", nullable: false),
                    ShortDescription = table.Column<string>(type: "TEXT", nullable: false),
                    ContentBody = table.Column<string>(type: "TEXT", nullable: false),
                    CreatedDTime = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedDTime = table.Column<DateTime>(type: "TEXT", nullable: false),
                    FlagActive = table.Column<bool>(type: "INTEGER", nullable: false),
                    ViewCount = table.Column<int>(type: "INTEGER", nullable: false),
                    ShareCount = table.Column<int>(type: "INTEGER", nullable: false),
                    LikeCount = table.Column<int>(type: "INTEGER", nullable: false),
                    AvgPoint = table.Column<double>(type: "REAL", nullable: false),
                    HashTag = table.Column<string>(type: "TEXT", nullable: false),
                    RefFile = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_News", x => x.NewsId);
                    table.ForeignKey(
                        name: "FK_News_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_News_NewsCategory_CategoryNewsId",
                        column: x => x.CategoryNewsId,
                        principalTable: "NewsCategory",
                        principalColumn: "NewsCategoryId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "HashTagNews",
                columns: table => new
                {
                    HashTagNewsId = table.Column<string>(type: "TEXT", nullable: false),
                    NewsId = table.Column<string>(type: "TEXT", nullable: false),
                    HashTagNewsName = table.Column<string>(type: "TEXT", maxLength: 30, nullable: false),
                    FlagActive = table.Column<bool>(type: "INTEGER", nullable: false),
                    CreatedDTime = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedDTime = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HashTagNews", x => x.HashTagNewsId);
                    table.ForeignKey(
                        name: "FK_HashTagNews_News_NewsId",
                        column: x => x.NewsId,
                        principalTable: "News",
                        principalColumn: "NewsId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PointNews",
                columns: table => new
                {
                    NewsId = table.Column<string>(type: "TEXT", nullable: false),
                    UserId = table.Column<string>(type: "TEXT", nullable: false),
                    Point = table.Column<double>(type: "REAL", nullable: false),
                    FlagActive = table.Column<bool>(type: "INTEGER", nullable: false),
                    CreatedDTime = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedDTime = table.Column<DateTime>(type: "TEXT", nullable: false),
                    NewsId1 = table.Column<string>(type: "TEXT", nullable: false),
                    AppUserId = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PointNews", x => new { x.NewsId, x.UserId });
                    table.ForeignKey(
                        name: "FK_PointNews_AspNetUsers_AppUserId",
                        column: x => x.AppUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_PointNews_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PointNews_News_NewsId",
                        column: x => x.NewsId,
                        principalTable: "News",
                        principalColumn: "NewsId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PointNews_News_NewsId1",
                        column: x => x.NewsId1,
                        principalTable: "News",
                        principalColumn: "NewsId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "RefFileNews",
                columns: table => new
                {
                    RefFileNewsId = table.Column<string>(type: "TEXT", nullable: false),
                    NewsId = table.Column<string>(type: "TEXT", nullable: false),
                    FileUrl = table.Column<string>(type: "TEXT", nullable: false),
                    FlagActive = table.Column<bool>(type: "INTEGER", nullable: false),
                    CreatedDTime = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedDTime = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RefFileNews", x => x.RefFileNewsId);
                    table.ForeignKey(
                        name: "FK_RefFileNews_News_NewsId",
                        column: x => x.NewsId,
                        principalTable: "News",
                        principalColumn: "NewsId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_HashTagNews_NewsId",
                table: "HashTagNews",
                column: "NewsId");

            migrationBuilder.CreateIndex(
                name: "IX_News_CategoryNewsId",
                table: "News",
                column: "CategoryNewsId");

            migrationBuilder.CreateIndex(
                name: "IX_News_UserId",
                table: "News",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_PointNews_AppUserId",
                table: "PointNews",
                column: "AppUserId");

            migrationBuilder.CreateIndex(
                name: "IX_PointNews_NewsId1",
                table: "PointNews",
                column: "NewsId1");

            migrationBuilder.CreateIndex(
                name: "IX_PointNews_UserId",
                table: "PointNews",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_RefFileNews_NewsId",
                table: "RefFileNews",
                column: "NewsId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "HashTagNews");

            migrationBuilder.DropTable(
                name: "PointNews");

            migrationBuilder.DropTable(
                name: "RefFileNews");

            migrationBuilder.DropTable(
                name: "News");

            migrationBuilder.DropTable(
                name: "NewsCategory");
        }
    }
}
