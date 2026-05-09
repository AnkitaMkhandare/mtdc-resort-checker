class CartPage {
  constructor(page) {
    this.page = page;
    this.cartItems = page.locator('.cart-item, [data-testid="cart-item"], .line-item, .cart-product');
    this.itemName = page.locator('.cart-item-name, .product-name, [data-testid="item-name"], .line-item-name').first();
    this.itemQuantity = page.locator('.cart-item-quantity input, [data-testid="item-quantity"], .quantity-value, .line-item-quantity input').first();
    this.cartSubtotal = page.locator('.cart-subtotal, [data-testid="cart-subtotal"], .order-subtotal, .subtotal-value').first();
    this.itemPrice = page.locator('.cart-item-price, [data-testid="item-price"], .line-item-price, .product-price').first();
    this.itemImage = page.locator('.cart-item img, [data-testid="item-image"], .line-item-image img').first();
  }

  async isCartPageLoaded() {
    await this.page.waitForLoadState('domcontentloaded');
    const url = this.page.url().toLowerCase();
    const content = (await this.page.content()).toLowerCase();
    return url.includes('cart') || content.includes('shopping cart') || content.includes('your cart');
  }

  async containsProduct(productName) {
    await this.page.waitForLoadState('domcontentloaded');
    return (await this.page.content()).includes(productName);
  }

  async getItemQuantity() {
    if (await this.itemQuantity.isVisible().catch(() => false)) {
      return parseInt(await this.itemQuantity.inputValue());
    }
    return -1;
  }

  async getSubtotal() {
    const text = (await this.cartSubtotal.textContent()).trim();
    return parseFloat(text.replace(/[^\d.]/g, ''));
  }

  async getItemPrice() {
    const text = (await this.itemPrice.textContent()).trim();
    return parseFloat(text.replace(/[^\d.]/g, ''));
  }

  async hasProductImage() {
    return (await this.page.locator('.cart-item img, [data-testid="item-image"], .line-item-image img').count()) > 0;
  }

  async hasProductName() {
    return (await this.page.locator('.cart-item-name, .product-name, [data-testid="item-name"], .line-item-name').count()) > 0;
  }

  async hasProductDetails() {
    return (await this.page.locator('.cart-item-details, .product-details, [data-testid="item-details"], .cart-item-name, .product-name').count()) > 0;
  }

  async isCartEmpty() {
    await this.page.waitForLoadState('domcontentloaded');
    const content = (await this.page.content()).toLowerCase();
    return content.includes('empty') || content.includes('no items')
      || (await this.cartItems.count()) === 0;
  }

  async refresh() {
    await this.page.reload();
    await this.page.waitForLoadState('domcontentloaded');
  }

  async getCartItemCount() {
    return await this.cartItems.count();
  }
}

module.exports = CartPage;