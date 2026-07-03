using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NzolaNet.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddFimbuUserActivity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "FimbuUserActivities",
                columns: table => new
                {
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Interactions = table.Column<long>(type: "bigint", nullable: false),
                    LastInteractionUtc = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FimbuUserActivities", x => x.UserId);
                });

            migrationBuilder.CreateIndex(
                name: "IX_FimbuUserActivities_Interactions",
                table: "FimbuUserActivities",
                column: "Interactions");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "FimbuUserActivities");
        }
    }
}
