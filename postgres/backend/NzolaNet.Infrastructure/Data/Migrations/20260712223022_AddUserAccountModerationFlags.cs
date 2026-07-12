using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NzolaNet.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddUserAccountModerationFlags : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsBanned",
                table: "AspNetUsers",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeactivated",
                table: "AspNetUsers",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsBanned",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "IsDeactivated",
                table: "AspNetUsers");
        }
    }
}
