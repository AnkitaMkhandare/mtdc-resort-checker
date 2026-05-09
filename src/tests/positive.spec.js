// @ts-check
const { test, expect } = require('@playwright/test');
const HomePage = require('../pages/HomePage');
const SearchResultsPage = require('../pages/SearchResultsPage');
const ProductDetailPage = require('../pages/ProductDetailPage');
const CartPage = require('../pages/CartPage');
const testdata = require('../config/testdata.json');
const config = require('../config/config.json');

test.describe('Positive Tests - Happy Path', () => {
  let homePage, searchResultsPage, productDetailPage, cartPage;
  let unitPrice;

  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    // Store page in a way accessible to all tests
    test.info().annotations.push({ type: 'page', description: 'shared' });
  });

  test('1. Search with valid keyword → verify relevant results', async ({ page }) => {
    homePage = new HomePage(page);
    searchResultsPage = new SearchResultsPage(page);

    await homePage.navigate(config.baseUrl);
    await homePage.searchFor(testdata.validSearchKeyword);

    expect(await searchResultsPage.hasResults()).toBeTruthy();
    expect(await searchResultsPage.resultsContainKeyword('smart tank')).toBeTruthy();
  });

  test('2. Select product → verify product detail page opens', async ({ page }) => {
    searchResultsPage = new SearchResultsPage(page);
    productDetailPage = new ProductDetailPage(page);

    await searchResultsPage.selectProduct(testdata.targetProduct);

    expect(await productDetailPage.isProductPageLoaded()).toBeTruthy();
    const title = await productDetailPage.getProductTitle();
    expect(title.toLowerCase()).toContain('smart tank');
  });

  test('3. Quantity update → verify quantity updates to 2', async ({ page }) => {
    productDetailPage = new ProductDetailPage(page);

    await productDetailPage.setQuantity(testdata.quantity);
    const qty = await productDetailPage.getQuantity();
    expect(qty).toBe(testdata.quantity);
  });

  test('4. Add to cart → verify cart subtotal appears', async ({ page }) => {
    productDetailPage = new ProductDetailPage(page);

    unitPrice = await productDetailPage.getUnitPrice();
    await productDetailPage.addToCart();

    expect(await productDetailPage.isSubtotalDisplayed()).toBeTruthy();
  });

  test('5. Subtotal calculation → verify subtotal = unit price × 2', async ({ page }) => {
    productDetailPage = new ProductDetailPage(page);

    const expectedSubtotal = unitPrice * testdata.quantity;
    const actualSubtotal = await productDetailPage.getDisplayedSubtotal();
    expect(actualSubtotal).toBeCloseTo(expectedSubtotal, 1);
  });

  test('6. Go to Cart → verify shopping cart page opens', async ({ page }) => {
    productDetailPage = new ProductDetailPage(page);
    cartPage = new CartPage(page);

    await productDetailPage.goToCart();
    expect(await cartPage.isCartPageLoaded()).toBeTruthy();
  });

  test('7. Cart item verification → confirm product with quantity 2', async ({ page }) => {
    cartPage = new CartPage(page);

    expect(await cartPage.containsProduct(testdata.targetProduct)).toBeTruthy();
    const qty = await cartPage.getItemQuantity();
    expect(qty).toBe(testdata.quantity);
  });

  test('8. Cart subtotal consistency → verify price × quantity', async ({ page }) => {
    cartPage = new CartPage(page);

    const itemPrice = await cartPage.getItemPrice();
    const subtotal = await cartPage.getSubtotal();
    expect(subtotal).toBeCloseTo(itemPrice * testdata.quantity, 1);
  });

  test('9. Cart page usability → verify image, name, details displayed', async ({ page }) => {
    cartPage = new CartPage(page);

    expect(await cartPage.hasProductImage()).toBeTruthy();
    expect(await cartPage.hasProductName()).toBeTruthy();
    expect(await cartPage.hasProductDetails()).toBeTruthy();
  });

  test('10. Cart persistence → refresh and verify items remain', async ({ page }) => {
    cartPage = new CartPage(page);

    const itemsBefore = await cartPage.getCartItemCount();
    await cartPage.refresh();

    expect(await cartPage.getCartItemCount()).toBe(itemsBefore);
    expect(await cartPage.containsProduct(testdata.targetProduct)).toBeTruthy();
  });
});