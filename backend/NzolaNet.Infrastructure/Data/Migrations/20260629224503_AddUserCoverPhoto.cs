using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NzolaNet.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddUserCoverPhoto : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CoverPhoto",
                table: "AspNetUsers",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CoverPhoto",
                table: "AspNetUsers");
        }
    }
}
