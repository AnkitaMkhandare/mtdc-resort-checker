package com.hp.automation.pages;

import com.microsoft.playwright.Locator;
import com.microsoft.playwright.Page;

import static com.microsoft.playwright.assertions.PlaywrightAssertions.assertThat;

public class SearchResultsPage {
    private final Page page;

    private static final String RESULT_ITEMS = ".product-tile, .search-result-item, [data-testid='product-tile'], .product-card";
    private static final String NO_RESULTS_MSG = ".no-results, [data-testid='no-results'], .search-no-results, :text('No results')";
    private static final String RESULT_TITLE = ".product-tile h2, .product-title, .product-name, [data-testid='product-name']";

    public SearchResultsPage(Page page) {
        this.page = page;
    }

    public boolean hasResults() {
        page.waitForLoadState();
        return page.locator(RESULT_ITEMS).count() > 0;
    }

    public boolean hasNoResultsMessage() {
        page.waitForLoadState();
        // Check for explicit no-results message or zero product tiles
        Locator noResults = page.locator(NO_RESULTS_MSG);
        if (noResults.count() > 0) return true;

        // Also check page content for common "no results" text
        String content = page.content().toLowerCase();
        return content.contains("no results") || content.contains("did not match")
                || content.contains("0 results") || content.contains("no products found");
    }

    public boolean resultsContainKeyword(String keyword) {
        page.waitForLoadState();
        String pageText = page.content().toLowerCase();
        return pageText.contains(keyword.toLowerCase());
    }

    public ProductDetailPage selectProduct(String productName) {
        page.waitForLoadState();
        // Try to find and click product by name
        Locator productLink = page.locator("a:has-text('" + productName + "')").first();
        if (productLink.isVisible()) {
            productLink.click();
        } else {
            // Fallback: look in result items
            Locator items = page.locator(RESULT_ITEMS);
            for (int i = 0; i < items.count(); i++) {
                String text = items.nth(i).textContent();
                if (text != null && text.contains(productName)) {
                    items.nth(i).click();
                    break;
                }
            }
        }
        page.waitForLoadState();
        return new ProductDetailPage(page);
    }

    public boolean isProductListed(String productName) {
        page.waitForLoadState();
        return page.locator("text=" + productName).count() > 0;
    }

    public boolean isPageFunctional() {
        // Verify page didn't crash - check for common error indicators
        String content = page.content().toLowerCase();
        return !content.contains("500 internal server error")
                && !content.contains("page not found")
                && page.url() != null;
    }
}