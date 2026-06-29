using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NzolaNet.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddCommentMedia : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ImagePath",
                table: "Comments",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "VideoPath",
                table: "Comments",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ImagePath",
                table: "Comments");

            migrationBuilder.DropColumn(
                name: "VideoPath",
                table: "Comments");
        }
    }
}
