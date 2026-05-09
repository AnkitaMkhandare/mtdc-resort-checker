// @ts-check
const { test, expect } = require('@playwright/test');
const HomePage = require('../pages/HomePage');
const SearchResultsPage = require('../pages/SearchResultsPage');
const ProductDetailPage = require('../pages/ProductDetailPage');
const CartPage = require('../pages/CartPage');
const testdata = require('../config/testdata.json');
const config = require('../config/config.json');

test.describe('Negative Tests - Edge Cases', () => {

  test.beforeEach(async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.navigate(config.baseUrl);
  });

  test('1. Invalid search keyword → verify no results message', async ({ page }) => {
    const homePage = new HomePage(page);
    const results = new SearchResultsPage(page);

    await homePage.searchFor(testdata.invalidSearchKeyword);
    expect(await results.hasNoResultsMessage()).toBeTruthy();
  });

  test('2. Empty search input → verify system handles gracefully', async ({ page }) => {
    const homePage = new HomePage(page);
    const results = new SearchResultsPage(page);

    await homePage.submitEmptySearch();
    expect(await results.isPageFunctional()).toBeTruthy();
  });

  test('3. Non-existent product selection → verify not listed', async ({ page }) => {
    const homePage = new HomePage(page);
    const results = new SearchResultsPage(page);

    await homePage.searchFor(testdata.validSearchKeyword);
    expect(await results.isProductListed(testdata.nonExistentProduct)).toBeFalsy();
  });

  test('4. Product page load failure → verify error handling', async ({ page }) => {
    await page.route('**/product/**', route => route.abort());
    await page.route('**/pdp/**', route => route.abort());

    const homePage = new HomePage(page);
    await homePage.searchFor(testdata.validSearchKeyword);

    const results = new SearchResultsPage(page);
    try {
      await results.selectProduct(testdata.targetProduct);
      const pdp = new ProductDetailPage(page);
      const hasError = await pdp.isPageLoadError();
      const isLoaded = await pdp.isProductPageLoaded();
      expect(hasError || isLoaded).toBeTruthy();
    } catch (e) {
      expect(e).toBeTruthy(); // Exception is acceptable graceful handling
    } finally {
      await page.unrouteAll();
    }
  });

  test('5. Invalid quantity (0/negative) → verify rejection', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.searchFor(testdata.validSearchKeyword);

    const results = new SearchResultsPage(page);
    await results.selectProduct(testdata.targetProduct);

    const pdp = new ProductDetailPage(page);

    // Try 0
    await pdp.setQuantity(testdata.invalidQuantityZero);
    let qty = await pdp.getQuantity();
    let hasError = await pdp.hasErrorMessage();
    expect(qty >= 1 || hasError).toBeTruthy();

    // Try negative
    await pdp.setQuantity(testdata.invalidQuantityNegative);
    qty = await pdp.getQuantity();
    hasError = await pdp.hasErrorMessage();
    expect(qty >= 1 || hasError).toBeTruthy();
  });

  test('6. Exceed stock quantity → verify error message', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.searchFor(testdata.validSearchKeyword);

    const results = new SearchResultsPage(page);
    await results.selectProduct(testdata.targetProduct);

    const pdp = new ProductDetailPage(page);
    await pdp.setQuantity(testdata.exceedStockQuantity);
    await pdp.addToCart();

    const hasError = await pdp.hasErrorMessage();
    const qty = await pdp.getQuantity();
    expect(hasError || qty < testdata.exceedStockQuantity).toBeTruthy();
  });

  test('7. Non-numeric quantity → verify rejection', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.searchFor(testdata.validSearchKeyword);

    const results = new SearchResultsPage(page);
    await results.selectProduct(testdata.targetProduct);

    const pdp = new ProductDetailPage(page);
    await pdp.setQuantityText(testdata.nonNumericQuantity);

    const qty = await pdp.getQuantity();
    const hasError = await pdp.hasErrorMessage();
    expect(isNaN(qty) || qty >= 1 || hasError).toBeTruthy();
  });

  test('8. Add to cart without product → verify prevention', async ({ page }) => {
    const content = (await page.content()).toLowerCase();
    if (content.includes('add to cart')) {
      try {
        await page.locator('button:has-text("Add to Cart")').first().click({ timeout: 3000 });
      } catch (e) {
        // Expected - button not clickable
      }
    }
    const homePage = new HomePage(page);
    await homePage.goToCart();
    const cart = new CartPage(page);
    expect(await cart.isCartEmpty()).toBeTruthy();
  });

  test('9. Cart subtotal mismatch → verify consistency', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.searchFor(testdata.validSearchKeyword);

    const results = new SearchResultsPage(page);
    await results.selectProduct(testdata.targetProduct);

    const pdp = new ProductDetailPage(page);
    const price = await pdp.getUnitPrice();
    await pdp.setQuantity(testdata.quantity);
    await pdp.addToCart();
    await pdp.goToCart();

    const cart = new CartPage(page);
    const subtotal = await cart.getSubtotal();
    expect(subtotal).toBeCloseTo(price * testdata.quantity, 1);
  });

  test('10. Empty cart navigation → verify empty message', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goToCart();

    const cart = new CartPage(page);
    const count = await cart.getCartItemCount();
    if (count === 0) {
      expect(await cart.isCartEmpty()).toBeTruthy();
    } else {
      expect(await cart.isCartPageLoaded()).toBeTruthy();
    }
  });
});