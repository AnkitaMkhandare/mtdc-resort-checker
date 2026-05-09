package com.hp.automation.base;

import com.hp.automation.utils.ConfigReader;
import com.microsoft.playwright.*;
import org.testng.annotations.AfterClass;
import org.testng.annotations.BeforeClass;

public abstract class BaseTest {
    protected Playwright playwright;
    protected Browser browser;
    protected BrowserContext context;
    protected Page page;

    @BeforeClass(alwaysRun = true)
    public void setUp() {
        playwright = Playwright.create();

        String browserType = ConfigReader.get("browser", "chromium");
        boolean headless = ConfigReader.getBoolean("headless", true);

        BrowserType.LaunchOptions launchOptions = new BrowserType.LaunchOptions()
                .setHeadless(headless);

        browser = switch (browserType.toLowerCase()) {
            case "firefox" -> playwright.firefox().launch(launchOptions);
            case "webkit" -> playwright.webkit().launch(launchOptions);
            default -> playwright.chromium().launch(launchOptions);
        };

        context = browser.newContext();
        page = context.newPage();
        page.setDefaultTimeout(ConfigReader.getInt("timeout", 30000));
    }

    @AfterClass(alwaysRun = true)
    public void tearDown() {
        if (page != null) page.close();
        if (context != null) context.close();
        if (browser != null) browser.close();
        if (playwright != null) playwright.close();
    }

    protected String getBaseUrl() {
        return ConfigReader.get("base.url", "https://www.hp.com/us-en/shop");
    }
}