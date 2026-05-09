class ProductDetailPage {
  constructor(page) {
    this.page = page;
    this.productTitle = page.locator('h1, .product-title, [data-testid="product-title"], .pdp-title').first();
    this.price = page.locator('.price, [data-testid="price"], .product-price, .current-price').first();
    this.quantityInput = page.locator('input[name="quantity"], input[type="number"], [data-testid="quantity-input"], .quantity-input input').first();
    this.quantitySelect = page.locator('select[name="quantity"], [data-testid="quantity-select"], .quantity-selector select').first();
    this.addToCartBtn = page.locator('button:has-text("Add to Cart"), button:has-text("Add to cart"), [data-testid="add-to-cart"], #add-to-cart-button').first();
    this.cartSubtotal = page.locator('.cart-subtotal, [data-testid="subtotal"], .mini-cart-subtotal, .subtotal').first();
    this.goToCartBtn = page.locator('a:has-text("Go to Cart"), a:has-text("View Cart"), button:has-text("Go to Cart"), [data-testid="go-to-cart"]').first();
    this.errorMessage = page.locator('.error-message, [data-testid="error"], .alert-danger, .error').first();
    this.productImage = page.locator('img.product-image, .pdp-image img, [data-testid="product-image"] img, .gallery img').first();
  }

  async isProductPageLoaded() {
    await this.page.waitForLoadState('domcontentloaded');
    return (await this.page.locator('h1, .product-title, [data-testid="product-title"], .pdp-title').count()) > 0;
  }

  async getProductTitle() {
    return (await this.productTitle.textContent()).trim();
  }

  async getUnitPrice() {
    const priceText = (await this.price.textContent()).trim();
    const numeric = priceText.replace(/[^\d.]/g, '');
    return parseFloat(numeric);
  }

  async setQuantity(quantity) {
    if (await this.quantityInput.isVisible().catch(() => false)) {
      await this.quantityInput.fill(String(quantity));
    } else if (await this.quantitySelect.isVisible().catch(() => false)) {
      await this.quantitySelect.selectOption(String(quantity));
    }
  }

  async setQuantityText(value) {
    if (await this.quantityInput.isVisible().catch(() => false)) {
      await this.quantityInput.fill(value);
    }
  }

  async getQuantity() {
    if (await this.quantityInput.isVisible().catch(() => false)) {
      return parseInt(await this.quantityInput.inputValue());
    }
    if (await this.quantitySelect.isVisible().catch(() => false)) {
      return parseInt(await this.quantitySelect.inputValue());
    }
    return 1;
  }

  async addToCart() {
    await this.addToCartBtn.click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  async isSubtotalDisplayed() {
    await this.page.waitForTimeout(2000);
    const count = await this.page.locator('.cart-subtotal, [data-testid="subtotal"], .mini-cart-subtotal, .subtotal').count();
    if (count > 0) return true;
    return (await this.page.content()).toLowerCase().includes('subtotal');
  }

  async getDisplayedSubtotal() {
    const text = (await this.cartSubtotal.textContent()).trim();
    return parseFloat(text.replace(/[^\d.]/g, ''));
  }

  async goToCart() {
    await this.goToCartBtn.click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  async hasErrorMessage() {
    return (await this.page.locator('.error-message, [data-testid="error"], .alert-danger, .error').count()) > 0;
  }

  async isPageLoadError() {
    const content = (await this.page.content()).toLowerCase();
    return content.includes('error') || content.includes('not found')
      || content.includes('500') || content.includes('something went wrong');
  }
}

module.exports = ProductDetailPage;