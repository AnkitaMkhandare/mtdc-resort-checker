package com.hp.automation.pages;

import com.microsoft.playwright.Locator;
import com.microsoft.playwright.Page;

public class CartPage {
    private final Page page;

    private static final String CART_ITEMS = ".cart-item, [data-testid='cart-item'], .line-item, .cart-product";
    private static final String ITEM_NAME = ".cart-item-name, .product-name, [data-testid='item-name'], .line-item-name";
    private static final String ITEM_QUANTITY = ".cart-item-quantity input, [data-testid='item-quantity'], .quantity-value, .line-item-quantity input";
    private static final String CART_SUBTOTAL = ".cart-subtotal, [data-testid='cart-subtotal'], .order-subtotal, .subtotal-value";
    private static final String ITEM_PRICE = ".cart-item-price, [data-testid='item-price'], .line-item-price, .product-price";
    private static final String ITEM_IMAGE = ".cart-item img, [data-testid='item-image'], .line-item-image img";
    private static final String EMPTY_CART_MSG = ":text('empty'), :text('no items'), [data-testid='empty-cart']";
    private static final String PRODUCT_DETAILS = ".cart-item-details, .product-details, [data-testid='item-details']";

    public CartPage(Page page) {
        this.page = page;
    }

    public boolean isCartPageLoaded() {
        page.waitForLoadState();
        String url = page.url().toLowerCase();
        String content = page.content().toLowerCase();
        return url.contains("cart") || content.contains("shopping cart") || content.contains("your cart");
    }

    public boolean containsProduct(String productName) {
        page.waitForLoadState();
        String content = page.content();
        return content.contains(productName);
    }

    public int getItemQuantity() {
        Locator qtyInput = page.locator(ITEM_QUANTITY).first();
        if (qtyInput.isVisible()) {
            String val = qtyInput.inputValue();
            return Integer.parseInt(val);
        }
        // Fallback: look for text
        Locator items = page.locator(CART_ITEMS);
        if (items.count() > 0) {
            String text = items.first().textContent();
            // Try to extract quantity from text
            java.util.regex.Matcher m = java.util.regex.Pattern.compile("(?:qty|quantity)[:\\s]*(\\d+)", java.util.regex.Pattern.CASE_INSENSITIVE).matcher(text);
            if (m.find()) return Integer.parseInt(m.group(1));
        }
        return -1;
    }

    public double getSubtotal() {
        String text = page.locator(CART_SUBTOTAL).first().textContent().trim();
        String numeric = text.replaceAll("[^\\d.]", "");
        return Double.parseDouble(numeric);
    }

    public double getItemPrice() {
        String text = page.locator(ITEM_PRICE).first().textContent().trim();
        String numeric = text.replaceAll("[^\\d.]", "");
        return Double.parseDouble(numeric);
    }

    public boolean hasProductImage() {
        return page.locator(ITEM_IMAGE).count() > 0;
    }

    public boolean hasProductName() {
        return page.locator(ITEM_NAME).count() > 0;
    }

    public boolean hasProductDetails() {
        return page.locator(PRODUCT_DETAILS).count() > 0
                || page.locator(ITEM_NAME).count() > 0;
    }

    public boolean isCartEmpty() {
        page.waitForLoadState();
        String content = page.content().toLowerCase();
        return content.contains("empty") || content.contains("no items")
                || page.locator(CART_ITEMS).count() == 0;
    }

    public CartPage refresh() {
        page.reload();
        page.waitForLoadState();
        return this;
    }

    public int getCartItemCount() {
        return page.locator(CART_ITEMS).count();
    }
}