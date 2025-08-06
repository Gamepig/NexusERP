# Playwright API Reference - Page and Locator Classes

## Page Class

### Navigation Methods
```javascript
// Basic navigation
await page.goto(url, options?)
await page.goBack(options?)
await page.goForward(options?)
await page.reload(options?)

// Navigation options
await page.goto('https://example.com', {
  timeout: 30000,
  waitUntil: 'networkidle', // 'load', 'domcontentloaded', 'networkidle'
  referer: 'https://google.com'
});

// Wait for navigation
await page.waitForNavigation(() => page.click('link'));
await page.waitForURL('**/dashboard');
await page.waitForLoadState('networkidle');
```

### Content Interaction
```javascript
// Text input
await page.fill(selector, value, options?)
await page.type(selector, text, options?)
await page.clear(selector)

// Click actions
await page.click(selector, options?)
await page.dblclick(selector, options?)
await page.hover(selector, options?)

// Form controls
await page.check(selector)
await page.uncheck(selector)
await page.selectOption(selector, values, options?)
await page.setInputFiles(selector, files, options?)

// Drag and drop
await page.dragAndDrop(source, target, options?)
```

### Content Retrieval
```javascript
// Get element content
const text = await page.textContent(selector);
const html = await page.innerHTML(selector);
const value = await page.inputValue(selector);
const attribute = await page.getAttribute(selector, name);

// Get multiple elements
const texts = await page.locator(selector).allTextContents();
const values = await page.locator(selector).allInnerTexts();
```

### Waiting Methods
```javascript
// Wait for selectors
await page.waitForSelector(selector, options?)
await page.waitForSelector('.loading', { state: 'detached' });

// Wait for functions
await page.waitForFunction(() => window.innerWidth < 500);
await page.waitForFunction(() => document.readyState === 'complete');

// Wait for requests/responses
await page.waitForRequest(url);
await page.waitForResponse(url);

// Wait for events
await page.waitForEvent('dialog');
await page.waitForEvent('popup');
```

### Evaluation and Scripts
```javascript
// Execute JavaScript
const result = await page.evaluate(() => {
  return document.title;
});

// Pass arguments to evaluate
const result = await page.evaluate((arg1, arg2) => {
  return arg1 + arg2;
}, 'hello', 'world');

// Evaluate handle (returns JSHandle)
const handle = await page.evaluateHandle(() => document.body);

// Add script/style tags
await page.addScriptTag({ content: 'console.log("test");' });
await page.addStyleTag({ content: 'body { margin: 0; }' });
```

### Dialog Handling
```javascript
// Handle dialogs
page.on('dialog', async dialog => {
  console.log(dialog.message());
  await dialog.accept('Yes');
  // or await dialog.dismiss();
});

// One-time handler
page.once('dialog', dialog => dialog.accept());
```

### Screenshot and PDF
```javascript
// Screenshots
await page.screenshot({ path: 'screenshot.png' });
await page.screenshot({ fullPage: true });
await page.screenshot({ clip: { x: 0, y: 0, width: 100, height: 100 } });

// PDF generation (Chromium only)
await page.pdf({ path: 'page.pdf', format: 'A4' });
```

### Network Control
```javascript
// Abort/modify requests
await page.route('**/*.jpg', route => route.abort());
await page.route('**/api/users', route => {
  route.fulfill({
    status: 200,
    body: JSON.stringify([{ name: 'Test User' }])
  });
});

// Unroute
await page.unroute('**/*.jpg');
```

## Locator Class

### Finding Elements
```javascript
// Get locator
const locator = page.locator(selector);
const locator = page.getByRole('button', { name: 'Submit' });

// Locator options
const locator = page.locator(selector, {
  has: page.locator('.child'),
  hasText: 'specific text'
});
```

### Actions on Locators
```javascript
// Click
await locator.click();
await locator.click({ 
  button: 'right',
  modifiers: ['Shift'],
  position: { x: 10, y: 10 },
  force: true,
  timeout: 5000
});

// Text input
await locator.fill('text');
await locator.type('text', { delay: 100 });
await locator.clear();

// Form controls
await locator.check();
await locator.uncheck();
await locator.selectOption('option');
await locator.setInputFiles('file.txt');

// Hover and focus
await locator.hover();
await locator.focus();
await locator.blur();
```

### Information Retrieval
```javascript
// Get content
const text = await locator.textContent();
const innerText = await locator.innerText();
const innerHTML = await locator.innerHTML();
const inputValue = await locator.inputValue();

// Get attributes
const href = await locator.getAttribute('href');
const allAttributes = await locator.evaluate(el => {
  const attrs = {};
  for (const attr of el.attributes) {
    attrs[attr.name] = attr.value;
  }
  return attrs;
});

// Bounding box
const box = await locator.boundingBox();
// Returns: { x, y, width, height } or null
```

### State Checks
```javascript
// Visibility
const isVisible = await locator.isVisible();
const isHidden = await locator.isHidden();

// DOM attachment
const isAttached = await locator.isAttached();

// Form states
const isChecked = await locator.isChecked();
const isDisabled = await locator.isDisabled();
const isEnabled = await locator.isEnabled();
const isEditable = await locator.isEditable();
```

### Filtering and Chaining
```javascript
// Filter locators
const filteredLocator = locator.filter({ hasText: 'text' });
const filteredLocator = locator.filter({ has: page.locator('.child') });

// Get specific instances
const first = locator.first();
const last = locator.last();
const nth = locator.nth(2);

// Count
const count = await locator.count();

// Get all matching elements
const allLocators = await locator.all();
```

### Advanced Locator Methods
```javascript
// Drag and drop
await locator.dragTo(targetLocator);

// Scroll into view
await locator.scrollIntoViewIfNeeded();

// Highlight (for debugging)
await locator.highlight();

// Wait for locator
await locator.waitFor({ state: 'visible', timeout: 10000 });

// Screenshot
await locator.screenshot({ path: 'element.png' });
```

## Browser Context API

### Context Creation
```javascript
const context = await browser.newContext({
  viewport: { width: 1280, height: 720 },
  userAgent: 'custom agent',
  locale: 'en-US',
  timezoneId: 'America/New_York',
  permissions: ['geolocation'],
  geolocation: { latitude: 37.7749, longitude: -122.4194 },
  colorScheme: 'dark',
  reducedMotion: 'reduce'
});
```

### Storage State
```javascript
// Save state
await context.storageState({ path: 'state.json' });

// Load state
const context = await browser.newContext({
  storageState: 'state.json'
});

// Cookies
await context.addCookies([{
  name: 'session',
  value: 'abc123',
  domain: 'example.com',
  path: '/'
}]);

const cookies = await context.cookies();
```

### Request Interception
```javascript
// Global route for context
await context.route('**/*.jpg', route => route.abort());

// Request/response events
context.on('request', request => {
  console.log(request.url());
});

context.on('response', response => {
  console.log(response.status(), response.url());
});
```

## Keyboard and Mouse APIs

### Keyboard
```javascript
// Single keys
await page.keyboard.press('Enter');
await page.keyboard.press('ArrowDown');
await page.keyboard.press('Meta+A'); // Cmd+A on Mac

// Key combinations
await page.keyboard.down('Shift');
await page.keyboard.press('ArrowDown');
await page.keyboard.up('Shift');

// Type text
await page.keyboard.type('Hello World', { delay: 100 });
```

### Mouse
```javascript
// Click at coordinates
await page.mouse.click(100, 200);

// Mouse movement
await page.mouse.move(100, 200);

// Drag and drop
await page.mouse.move(100, 200);
await page.mouse.down();
await page.mouse.move(300, 400);
await page.mouse.up();

// Wheel scroll
await page.mouse.wheel(0, 100);
```

## Touch API (Mobile)
```javascript
// Touch events
await page.touchscreen.tap(100, 200);

// Multi-touch
await page.touchscreen.touchStart([
  { x: 100, y: 200 },
  { x: 300, y: 400 }
]);
await page.touchscreen.touchEnd();
```