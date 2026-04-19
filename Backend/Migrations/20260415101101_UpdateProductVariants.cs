using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Migrations
{
    /// <inheritdoc />
    public partial class UpdateProductVariants : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_cartitems_products_ProductId",
                table: "cartitems");

            migrationBuilder.DropForeignKey(
                name: "FK_orderdetails_products_ProductId",
                table: "orderdetails");

            migrationBuilder.DropColumn(
                name: "Color",
                table: "products");

            migrationBuilder.DropColumn(
                name: "CostPrice",
                table: "products");

            migrationBuilder.DropColumn(
                name: "Instock",
                table: "products");

            migrationBuilder.DropColumn(
                name: "Price",
                table: "products");

            migrationBuilder.DropColumn(
                name: "Size",
                table: "products");

            migrationBuilder.RenameColumn(
                name: "ProductId",
                table: "orderdetails",
                newName: "ProductVariantId");

            migrationBuilder.RenameIndex(
                name: "IX_orderdetails_ProductId",
                table: "orderdetails",
                newName: "IX_orderdetails_ProductVariantId");

            migrationBuilder.RenameColumn(
                name: "ProductId",
                table: "cartitems",
                newName: "ProductVariantId");

            migrationBuilder.RenameIndex(
                name: "IX_cartitems_ProductId",
                table: "cartitems",
                newName: "IX_cartitems_ProductVariantId");

            migrationBuilder.CreateTable(
                name: "product_variants",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    ProductId = table.Column<int>(type: "int", nullable: false),
                    Size = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Color = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    CostPrice = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Price = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Instock = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_product_variants", x => x.Id);
                    table.ForeignKey(
                        name: "FK_product_variants_products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_product_variants_ProductId",
                table: "product_variants",
                column: "ProductId");

            migrationBuilder.AddForeignKey(
                name: "FK_cartitems_product_variants_ProductVariantId",
                table: "cartitems",
                column: "ProductVariantId",
                principalTable: "product_variants",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_orderdetails_product_variants_ProductVariantId",
                table: "orderdetails",
                column: "ProductVariantId",
                principalTable: "product_variants",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_cartitems_product_variants_ProductVariantId",
                table: "cartitems");

            migrationBuilder.DropForeignKey(
                name: "FK_orderdetails_product_variants_ProductVariantId",
                table: "orderdetails");

            migrationBuilder.DropTable(
                name: "product_variants");

            migrationBuilder.RenameColumn(
                name: "ProductVariantId",
                table: "orderdetails",
                newName: "ProductId");

            migrationBuilder.RenameIndex(
                name: "IX_orderdetails_ProductVariantId",
                table: "orderdetails",
                newName: "IX_orderdetails_ProductId");

            migrationBuilder.RenameColumn(
                name: "ProductVariantId",
                table: "cartitems",
                newName: "ProductId");

            migrationBuilder.RenameIndex(
                name: "IX_cartitems_ProductVariantId",
                table: "cartitems",
                newName: "IX_cartitems_ProductId");

            migrationBuilder.AddColumn<string>(
                name: "Color",
                table: "products",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "CostPrice",
                table: "products",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<int>(
                name: "Instock",
                table: "products",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<decimal>(
                name: "Price",
                table: "products",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "Size",
                table: "products",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_cartitems_products_ProductId",
                table: "cartitems",
                column: "ProductId",
                principalTable: "products",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_orderdetails_products_ProductId",
                table: "orderdetails",
                column: "ProductId",
                principalTable: "products",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
