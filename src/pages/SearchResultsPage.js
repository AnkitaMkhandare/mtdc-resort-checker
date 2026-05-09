class SearchResultsPage {
  constructor(page) {
    this.page = page;
    this.resultItems = page.locator('.product-tile, .search-result-item, [data-testid="product-tile"], .product-card');
    this.noResultsMsg = page.locator('.no-results, [data-testid="no-results"], .search-no-results');
  }

  async hasResults() {
    await this.page.waitForLoadState('domcontentloaded');
    return (await this.resultItems.count()) > 0;
  }

  async hasNoResultsMessage() {
    await this.page.waitForLoadState('domcontentloaded');
    if ((await this.noResultsMsg.count()) > 0) return true;
    const content = (await this.page.content()).toLowerCase();
    return content.includes('no results') || content.includes('did not match')
      || content.includes('0 results') || content.includes('no products found');
  }

  async resultsContainKeyword(keyword) {
    await this.page.waitForLoadState('domcontentloaded');
    const content = (await this.page.content()).toLowerCase();
    return content.includes(keyword.toLowerCase());
  }

  async selectProduct(productName) {
    await this.page.waitForLoadState('domcontentloaded');
    const productLink = this.page.locator(`a:has-text("${productName}")`).first();
    if (await productLink.isVisible().catch(() => false)) {
      await productLink.click();
    } else {
      const items = this.resultItems;
      const count = await items.count();
      for (let i = 0; i < count; i++) {
        const text = await items.nth(i).textContent();
        if (text && text.includes(productName)) {
          await items.nth(i).click();
          break;
        }
      }
    }
    await this.page.waitForLoadState('domcontentloaded');
  }

  async isProductListed(productName) {
    await this.page.waitForLoadState('domcontentloaded');
    return (await this.page.locator(`text=${productName}`).count()) > 0;
  }

  async isPageFunctional() {
    const content = (await this.page.content()).toLowerCase();
    return !content.includes('500 internal server error')
      && !content.includes('page not found');
  }
}

module.exports = SearchResultsPage;