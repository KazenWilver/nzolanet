using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NzolaNet.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddQuotedPostAndGroupDetails : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "QuotedPostId",
                table: "Posts",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "Conversations",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ImagePath",
                table: "Conversations",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Posts_QuotedPostId",
                table: "Posts",
                column: "QuotedPostId");

            migrationBuilder.AddForeignKey(
                name: "FK_Posts_Posts_QuotedPostId",
                table: "Posts",
                column: "QuotedPostId",
                principalTable: "Posts",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Posts_Posts_QuotedPostId",
                table: "Posts");

            migrationBuilder.DropIndex(
                name: "IX_Posts_QuotedPostId",
                table: "Posts");

            migrationBuilder.DropColumn(
                name: "QuotedPostId",
                table: "Posts");

            migrationBuilder.DropColumn(
                name: "Description",
                table: "Conversations");

            migrationBuilder.DropColumn(
                name: "ImagePath",
                table: "Conversations");
        }
    }
}
