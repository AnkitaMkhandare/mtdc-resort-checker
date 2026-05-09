package com.hp.automation.positive;

import com.hp.automation.base.BaseTest;
import com.hp.automation.pages.*;
import com.hp.automation.utils.TestDataReader;
import org.testng.Assert;
import org.testng.annotations.BeforeClass;
import org.testng.annotations.Test;

@Test(groups = "positive")
public class HappyPathTest extends BaseTest {

    private HomePage homePage;
    private SearchResultsPage searchResultsPage;
    private ProductDetailPage productDetailPage;
    private CartPage cartPage;
    private double unitPrice;

    @BeforeClass(alwaysRun = true)
    @Override
    public void setUp() {
        super.setUp();
        homePage = new HomePage(page, getBaseUrl());
    }

    @Test(priority = 1, description = "Search with valid keyword and verify relevant results")
    public void testSearchWithValidKeyword() {
        String keyword = TestDataReader.getString("validSearchKeyword");
        homePage.navigate();
        searchResultsPage = homePage.searchFor(keyword);

        Assert.assertTrue(searchResultsPage.hasResults(),
                "Search results should be displayed for keyword: " + keyword);
        Assert.assertTrue(searchResultsPage.resultsContainKeyword("smart tank"),
                "Results should contain relevant products");
    }

    @Test(priority = 2, dependsOnMethods = "testSearchWithValidKeyword",
            description = "Select target product and verify product detail page opens")
    public void testCorrectProductSelection() {
        String product = TestDataReader.getString("targetProduct");
        productDetailPage = searchResultsPage.selectProduct(product);

        Assert.assertTrue(productDetailPage.isProductPageLoaded(),
                "Product detail page should load for: " + product);
        Assert.assertTrue(productDetailPage.getProductTitle().contains("Smart Tank"),
                "Product title should contain 'Smart Tank'");
    }

    @Test(priority = 3, dependsOnMethods = "testCorrectProductSelection",
            description = "Update quantity to 2 and verify")
    public void testQuantityUpdate() {
        int qty = TestDataReader.getInt("quantity");
        productDetailPage.setQuantity(qty);

        Assert.assertEquals(productDetailPage.getQuantity(), qty,
                "Quantity should be updated to " + qty);
    }

    @Test(priority = 4, dependsOnMethods = "testQuantityUpdate",
            description = "Add to cart and verify subtotal appears")
    public void testAddToCart() {
        unitPrice = productDetailPage.getUnitPrice();
        productDetailPage.addToCart();

        Assert.assertTrue(productDetailPage.isSubtotalDisplayed(),
                "Cart subtotal should appear after adding to cart");
    }

    @Test(priority = 5, dependsOnMethods = "testAddToCart",
            description = "Verify subtotal = unit price × quantity")
    public void testSubtotalCalculation() {
        int qty = TestDataReader.getInt("quantity");
        double expectedSubtotal = unitPrice * qty;
        double actualSubtotal = productDetailPage.getDisplayedSubtotal();

        Assert.assertEquals(actualSubtotal, expectedSubtotal, 0.01,
                "Subtotal should equal unit price ($" + unitPrice + ") × " + qty);
    }

    @Test(priority = 6, dependsOnMethods = "testAddToCart",
            description = "Click Go to Cart and verify shopping cart page opens")
    public void testGoToCartNavigation() {
        cartPage = productDetailPage.goToCart();

        Assert.assertTrue(cartPage.isCartPageLoaded(),
                "Shopping cart page should be displayed");
    }

    @Test(priority = 7, dependsOnMethods = "testGoToCartNavigation",
            description = "Confirm cart contains target product with correct quantity")
    public void testCartItemVerification() {
        String product = TestDataReader.getString("targetProduct");
        int qty = TestDataReader.getInt("quantity");

        Assert.assertTrue(cartPage.containsProduct(product),
                "Cart should contain: " + product);
        Assert.assertEquals(cartPage.getItemQuantity(), qty,
                "Cart quantity should be " + qty);
    }

    @Test(priority = 8, dependsOnMethods = "testGoToCartNavigation",
            description = "Verify cart subtotal matches product price × quantity")
    public void testCartSubtotalConsistency() {
        int qty = TestDataReader.getInt("quantity");
        double itemPrice = cartPage.getItemPrice();
        double subtotal = cartPage.getSubtotal();

        Assert.assertEquals(subtotal, itemPrice * qty, 0.01,
                "Cart subtotal should match price × quantity");
    }

    @Test(priority = 9, dependsOnMethods = "testGoToCartNavigation",
            description = "Verify product image, name, and details displayed in cart")
    public void testCartPageUsability() {
        Assert.assertTrue(cartPage.hasProductImage(),
                "Product image should be displayed in cart");
        Assert.assertTrue(cartPage.hasProductName(),
                "Product name should be displayed in cart");
        Assert.assertTrue(cartPage.hasProductDetails(),
                "Product details should be displayed in cart");
    }

    @Test(priority = 10, dependsOnMethods = "testGoToCartNavigation",
            description = "Refresh cart page and verify items remain intact")
    public void testCartPersistence() {
        String product = TestDataReader.getString("targetProduct");
        int expectedQty = TestDataReader.getInt("quantity");
        int itemsBefore = cartPage.getCartItemCount();

        cartPage.refresh();

        Assert.assertEquals(cartPage.getCartItemCount(), itemsBefore,
                "Cart item count should remain the same after refresh");
        Assert.assertTrue(cartPage.containsProduct(product),
                "Product should still be in cart after refresh");
    }
}