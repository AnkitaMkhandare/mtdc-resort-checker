package com.hp.automation.pages;

import com.microsoft.playwright.Locator;
import com.microsoft.playwright.Page;
import com.microsoft.playwright.options.AriaRole;

import static com.microsoft.playwright.assertions.PlaywrightAssertions.assertThat;

public class HomePage {
    private final Page page;
    private final String baseUrl;

    // Locators
    private static final String SEARCH_ICON = "[data-testid='search-icon'], .search-icon, button[aria-label*='Search'], #search-icon";
    private static final String SEARCH_INPUT = "input[type='search'], input[name='q'], input[placeholder*='Search'], #searchInput";
    private static final String SEARCH_SUBMIT = "button[type='submit'], [data-testid='search-submit'], button[aria-label='Submit search']";
    private static final String CART_ICON = "[data-testid='cart-icon'], .cart-icon, a[href*='cart'], #cart-icon";

    public HomePage(Page page, String baseUrl) {
        this.page = page;
        this.baseUrl = baseUrl;
    }

    public HomePage navigate() {
        page.navigate(baseUrl);
        page.waitForLoadState();
        return this;
    }

    public SearchResultsPage searchFor(String keyword) {
        // Try clicking search icon first to open search bar
        Locator searchIcon = page.locator(SEARCH_ICON).first();
        if (searchIcon.isVisible()) {
            searchIcon.click();
        }

        Locator searchInput = page.locator(SEARCH_INPUT).first();
        searchInput.waitFor();
        searchInput.fill(keyword);
        searchInput.press("Enter");

        page.waitForLoadState();
        return new SearchResultsPage(page);
    }

    public SearchResultsPage submitEmptySearch() {
        Locator searchIcon = page.locator(SEARCH_ICON).first();
        if (searchIcon.isVisible()) {
            searchIcon.click();
        }

        Locator searchInput = page.locator(SEARCH_INPUT).first();
        searchInput.waitFor();
        searchInput.fill("");
        searchInput.press("Enter");

        page.waitForLoadState();
        return new SearchResultsPage(page);
    }

    public CartPage goToCart() {
        page.locator(CART_ICON).first().click();
        page.waitForLoadState();
        return new CartPage(page);
    }
}