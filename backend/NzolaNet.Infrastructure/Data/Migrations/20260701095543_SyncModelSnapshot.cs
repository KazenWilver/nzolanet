using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NzolaNet.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    /// <remarks>
    /// No-op migration: schema changes live in AddContentReports and AddConversationsAndMessages.
    /// This migration only aligns the EF model snapshot with ApplicationDbContext.
    /// </remarks>
    public partial class SyncModelSnapshot : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
        }
    }
}
