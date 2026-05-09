# HP Store Automation Test Suite

Automated test suite for HP Store e-commerce workflows using **Java + Playwright + TestNG + Maven**.

## Project Structure

```
├── pom.xml                          # Maven config with dependencies
├── testng.xml                       # TestNG suite configuration
├── Jenkinsfile                      # CI/CD pipeline
├── src/
│   ├── main/java/com/hp/automation/
│   │   ├── base/BaseTest.java       # Browser setup/teardown
│   │   ├── pages/                   # Page Object Model classes
│   │   │   ├── HomePage.java
│   │   │   ├── SearchResultsPage.java
│   │   │   ├── ProductDetailPage.java
│   │   │   └── CartPage.java
│   │   └── utils/
│   │       ├── ConfigReader.java    # Environment config loader
│   │       └── TestDataReader.java  # Test data JSON loader
│   └── test/
│       ├── java/com/hp/automation/
│       │   ├── positive/HappyPathTest.java   # 10 positive tests
│       │   └── negative/NegativeTest.java    # 10 negative tests
│       └── resources/
│           ├── config.properties    # Base URL, browser, timeouts
│           └── testdata.json        # Search terms, product names, quantities
```

## Prerequisites

- Java 17+
- Maven 3.8+
- Playwright browsers (auto-installed)

## Quick Start

```bash
# Install dependencies and Playwright browsers
mvn clean install -DskipTests
mvn exec:java -e -Dexec.mainClass=com.microsoft.playwright.CLI -Dexec.args="install --with-deps"

# Run all tests
mvn test

# Run only positive tests
mvn test -Dgroups=positive

# Run only negative tests
mvn test -Dgroups=negative

# Run with specific browser
mvn test -Dbrowser=firefox

# Run headed (visible browser)
mvn test -Dheadless=false
```

## Environment Configuration

Edit `src/test/resources/config.properties` to change target environment:

| Property   | Description              | Default                          |
|------------|--------------------------|----------------------------------|
| base.url   | Target store URL         | https://www.hp.com/us-en/shop    |
| browser    | chromium/firefox/webkit  | chromium                         |
| headless   | Run headless             | true                             |
| timeout    | Default timeout (ms)     | 30000                            |

## Test Data

Edit `src/test/resources/testdata.json` to change test data for different environments.

## CI/CD

The `Jenkinsfile` provides a parameterized pipeline with:
- Browser selection (chromium/firefox/webkit)
- Environment selection
- Headless toggle
- TestNG report publishing
- Artifact archiving

## Design Patterns

- **Page Object Model (POM)** — Locators and interactions encapsulated per page
- **Data-Driven** — Externalized config and test data (swap files per environment)
- **Base Test Pattern** — Common browser setup/teardown inherited by all tests
- **TestNG Groups** — Selective test execution (positive/negative)

## Test Coverage

### Positive (10 tests)
1. Valid keyword search
2. Product selection
3. Quantity update
4. Add to cart
5. Subtotal calculation
6. Go to Cart navigation
7. Cart item verification
8. Cart subtotal consistency
9. Cart page usability (image, name, details)
10. Cart persistence after refresh

### Negative (10 tests)
1. Invalid search keyword
2. Empty search input
3. Non-existent product selection
4. Product page load failure (network interception)
5. Invalid quantity (0/negative)
6. Exceed stock quantity
7. Non-numeric quantity input
8. Add to cart without product
9. Cart subtotal mismatch detection
10. Empty cart navigation