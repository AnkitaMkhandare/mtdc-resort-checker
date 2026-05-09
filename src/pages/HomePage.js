class HomePage {
  constructor(page) {
    this.page = page;
  }

  async navigate(baseUrl) {
    await this.page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
    // Handle cookie consent banner
    try {
      const acceptBtn = this.page.locator('#onetrust-accept-btn-handler');
      await acceptBtn.waitFor({ state: 'visible', timeout: 10000 });
      await acceptBtn.click();
      await this.page.waitForTimeout(1000);
    } catch (e) {
      // No cookie banner - continue
    }
    await this.page.waitForLoadState('networkidle').catch(() => {});
  }

  async searchFor(keyword) {
    // Click search trigger to open search panel
    const searchTrigger = this.page.locator('button.digitnav__search-trigger, button[aria-label="Search"], button.search.svg-icon').first();
    await searchTrigger.click();
    
    // Wait for search input to become visible
    const searchInput = this.page.locator('#search_focus_desktop').first();
    await searchInput.waitFor({ state: 'visible', timeout: 15000 });
    await searchInput.fill(keyword);
    await searchInput.press('Enter');
    await this.page.waitForLoadState('domcontentloaded');
    // Wait for search results page
    await this.page.waitForTimeout(2000);
  }

  async submitEmptySearch() {
    const searchTrigger = this.page.locator('button.digitnav__search-trigger, button[aria-label="Search"], button.search.svg-icon').first();
    await searchTrigger.click();

    const searchInput = this.page.locator('#search_focus_desktop').first();
    await searchInput.waitFor({ state: 'visible', timeout: 15000 });
    await searchInput.fill('');
    await searchInput.press('Enter');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async goToCart() {
    await this.page.locator('#desktopCartButton, a.cart-button[aria-label="cart"]').first().click();
    await this.page.waitForLoadState('domcontentloaded');
  }
}

module.exports = HomePage;