# Playwright Core Concepts

## Browser Context and Pages

### Browser Context
- Isolated environment equivalent to an incognito browser profile
- Contains multiple pages
- Shares cookies, local storage, and sessions

```javascript
const context = await browser.newContext({
  viewport: { width: 1280, height: 720 },
  userAgent: 'Custom User Agent',
  locale: 'en-US',
  timezoneId: 'America/New_York'
});

const page = await context.newPage();
```

### Page
- A single tab within a browser context
- Main interface for interacting with web content

```javascript
const page = await context.newPage();
await page.goto('https://example.com');
```

## Locators

### Core Locator Methods
```javascript
// Recommended: Built-in locators
page.getByRole('button', { name: 'Submit' })
page.getByText('Welcome')
page.getByLabel('Email')
page.getByPlaceholder('Enter email')
page.getByAltText('Profile picture')
page.getByTitle('More information')
page.getByTestId('submit-button')

// CSS selectors
page.locator('css=button')
page.locator('button >> text=Submit')

// XPath
page.locator('xpath=//button[contains(text(), "Submit")]')

// Combining locators
page.locator('article').getByRole('button')
```

### Locator Filtering
```javascript
// Filter by text
page.getByRole('button').filter({ hasText: 'Submit' })

// Filter by another locator
page.getByRole('listitem').filter({
  has: page.getByRole('button', { name: 'Delete' })
})

// Count and nth
await expect(page.getByRole('button')).toHaveCount(3);
page.getByRole('button').nth(0) // First button
page.getByRole('button').first()
page.getByRole('button').last()
```

## Auto-Waiting

### Actionability Checks
Playwright automatically waits for elements to be:
- Attached to DOM
- Visible
- Stable (not animating)
- Enabled
- Editable (for input actions)

### Timeout Configuration
```javascript
// Global timeout in config
export default defineConfig({
  use: {
    actionTimeout: 30000,
    navigationTimeout: 30000
  }
});

// Per action timeout
await page.click('button', { timeout: 10000 });

// Wait for specific conditions
await page.waitForSelector('.loading', { state: 'detached' });
await page.waitForLoadState('networkidle');
```

## Basic Actions

### Navigation
```javascript
await page.goto('https://example.com');
await page.goBack();
await page.goForward();
await page.reload();
```

### Clicking
```javascript
await page.click('button');
await page.dblclick('input');
await page.click('button', { 
  button: 'right',
  modifiers: ['Shift'],
  position: { x: 10, y: 10 }
});
```

### Text Input
```javascript
await page.fill('input[name="email"]', 'user@example.com');
await page.type('input', 'text', { delay: 100 });
await page.clear('input');
```

### Form Handling
```javascript
await page.selectOption('select', 'value');
await page.check('input[type="checkbox"]');
await page.uncheck('input[type="checkbox"]');
await page.setInputFiles('input[type="file"]', 'path/to/file.txt');
```

### Keyboard and Mouse
```javascript
await page.keyboard.press('Enter');
await page.keyboard.type('Hello World');
await page.keyboard.down('Shift');

await page.mouse.click(100, 200);
await page.mouse.wheel(0, 100);
```

## State Management

### Cookies
```javascript
// Set cookies
await context.addCookies([{
  name: 'session',
  value: 'abc123',
  domain: 'example.com',
  path: '/'
}]);

// Get cookies
const cookies = await context.cookies();
```

### Local Storage
```javascript
await page.evaluate(() => {
  localStorage.setItem('key', 'value');
});

const value = await page.evaluate(() => localStorage.getItem('key'));
```

### Session Storage
```javascript
await page.evaluate(() => {
  sessionStorage.setItem('key', 'value');
});
```

## Mobile and Device Emulation

### Device Emulation
```javascript
const { devices } = require('@playwright/test');

const context = await browser.newContext({
  ...devices['iPhone 12'],
});

// Custom device
const context = await browser.newContext({
  viewport: { width: 375, height: 667 },
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true
});
```

### Geolocation
```javascript
await context.setGeolocation({ latitude: 37.7749, longitude: -122.4194 });
await context.grantPermissions(['geolocation']);
```

## Error Handling

### Try-Catch Patterns
```javascript
try {
  await page.click('button', { timeout: 5000 });
} catch (error) {
  if (error.name === 'TimeoutError') {
    console.log('Button not found within timeout');
  }
}
```

### Soft Assertions
```javascript
await expect.soft(page.locator('#title')).toHaveText('Expected Title');
await expect.soft(page.locator('#count')).toHaveText('5');
// Test continues even if soft assertions fail
```