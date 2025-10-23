using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddUserIdCategoryId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "UserId",
                table: "products",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "UserId",
                table: "categories",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_products_UserId",
                table: "products",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_categories_UserId",
                table: "categories",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_categories_users_UserId",
                table: "categories",
                column: "UserId",
                principalTable: "users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_products_users_UserId",
                table: "products",
                column: "UserId",
                principalTable: "users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_categories_users_UserId",
                table: "categories");

            migrationBuilder.DropForeignKey(
                name: "FK_products_users_UserId",
                table: "products");

            migrationBuilder.DropIndex(
                name: "IX_products_UserId",
                table: "products");

            migrationBuilder.DropIndex(
                name: "IX_categories_UserId",
                table: "categories");

            migrationBuilder.DropColumn(
                name: "UserId",
                table: "products");

            migrationBuilder.DropColumn(
                name: "UserId",
                table: "categories");
        }
    }
}
