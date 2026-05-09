package com.hp.automation.pages;

import com.microsoft.playwright.Locator;
import com.microsoft.playwright.Page;

import static com.microsoft.playwright.assertions.PlaywrightAssertions.assertThat;

public class ProductDetailPage {
    private final Page page;

    private static final String PRODUCT_TITLE = "h1, .product-title, [data-testid='product-title'], .pdp-title";
    private static final String PRICE = ".price, [data-testid='price'], .product-price, .current-price";
    private static final String QUANTITY_INPUT = "input[name='quantity'], input[type='number'], [data-testid='quantity-input'], .quantity-input input";
    private static final String QUANTITY_SELECT = "select[name='quantity'], [data-testid='quantity-select'], .quantity-selector select";
    private static final String ADD_TO_CART_BTN = "button:has-text('Add to Cart'), button:has-text('Add to cart'), [data-testid='add-to-cart'], #add-to-cart-button";
    private static final String CART_SUBTOTAL = ".cart-subtotal, [data-testid='subtotal'], .mini-cart-subtotal, .subtotal";
    private static final String GO_TO_CART_BTN = "a:has-text('Go to Cart'), a:has-text('View Cart'), button:has-text('Go to Cart'), [data-testid='go-to-cart']";
    private static final String ERROR_MESSAGE = ".error-message, [data-testid='error'], .alert-danger, .error";
    private static final String PRODUCT_IMAGE = "img.product-image, .pdp-image img, [data-testid='product-image'] img, .gallery img";

    public ProductDetailPage(Page page) {
        this.page = page;
    }

    public boolean isProductPageLoaded() {
        page.waitForLoadState();
        return page.locator(PRODUCT_TITLE).count() > 0;
    }

    public String getProductTitle() {
        return page.locator(PRODUCT_TITLE).first().textContent().trim();
    }

    public double getUnitPrice() {
        String priceText = page.locator(PRICE).first().textContent().trim();
        // Extract numeric value from price string (e.g., "$199.99" -> 199.99)
        String numericPrice = priceText.replaceAll("[^\\d.]", "");
        return Double.parseDouble(numericPrice);
    }

    public ProductDetailPage setQuantity(int quantity) {
        // Try input field first
        Locator input = page.locator(QUANTITY_INPUT).first();
        if (input.isVisible()) {
            input.fill(String.valueOf(quantity));
            return this;
        }
        // Try select dropdown
        Locator select = page.locator(QUANTITY_SELECT).first();
        if (select.isVisible()) {
            select.selectOption(String.valueOf(quantity));
        }
        return this;
    }

    public ProductDetailPage setQuantityText(String value) {
        Locator input = page.locator(QUANTITY_INPUT).first();
        if (input.isVisible()) {
            input.fill(value);
        }
        return this;
    }

    public int getQuantity() {
        Locator input = page.locator(QUANTITY_INPUT).first();
        if (input.isVisible()) {
            return Integer.parseInt(input.inputValue());
        }
        Locator select = page.locator(QUANTITY_SELECT).first();
        if (select.isVisible()) {
            return Integer.parseInt(select.inputValue());
        }
        return 1;
    }

    public ProductDetailPage addToCart() {
        page.locator(ADD_TO_CART_BTN).first().click();
        page.waitForLoadState();
        return this;
    }

    public boolean isSubtotalDisplayed() {
        // Wait briefly for cart flyout/modal
        page.waitForTimeout(2000);
        return page.locator(CART_SUBTOTAL).count() > 0
                || page.content().toLowerCase().contains("subtotal");
    }

    public double getDisplayedSubtotal() {
        String text = page.locator(CART_SUBTOTAL).first().textContent().trim();
        String numeric = text.replaceAll("[^\\d.]", "");
        return Double.parseDouble(numeric);
    }

    public CartPage goToCart() {
        page.locator(GO_TO_CART_BTN).first().click();
        page.waitForLoadState();
        return new CartPage(page);
    }

    public boolean hasErrorMessage() {
        return page.locator(ERROR_MESSAGE).count() > 0;
    }

    public String getErrorMessage() {
        return page.locator(ERROR_MESSAGE).first().textContent().trim();
    }

    public boolean hasProductImage() {
        return page.locator(PRODUCT_IMAGE).count() > 0;
    }

    public boolean isPageLoadError() {
        String content = page.content().toLowerCase();
        return content.contains("error") || content.contains("not found")
                || content.contains("500") || content.contains("something went wrong");
    }
}