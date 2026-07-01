using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NzolaNet.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddMessageDocumentAndAudio : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Posts_Posts_QuotedPostId",
                table: "Posts");

            migrationBuilder.AddColumn<string>(
                name: "AudioPath",
                table: "Messages",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DocumentFileName",
                table: "Messages",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DocumentPath",
                table: "Messages",
                type: "nvarchar(max)",
                nullable: true);

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

            migrationBuilder.DropColumn(
                name: "AudioPath",
                table: "Messages");

            migrationBuilder.DropColumn(
                name: "DocumentFileName",
                table: "Messages");

            migrationBuilder.DropColumn(
                name: "DocumentPath",
                table: "Messages");

            migrationBuilder.AddForeignKey(
                name: "FK_Posts_Posts_QuotedPostId",
                table: "Posts",
                column: "QuotedPostId",
                principalTable: "Posts",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }
    }
}
