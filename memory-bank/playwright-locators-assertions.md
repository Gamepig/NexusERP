# Playwright Locators and Assertions Reference

## Locator Types and Best Practices

### Recommended Locators (Role-based)
```javascript
// Button by accessible name
page.getByRole('button', { name: 'Submit' })
page.getByRole('button', { name: /submit/i }) // Case insensitive regex

// Link by accessible name
page.getByRole('link', { name: 'Home' })

// Textbox by label
page.getByRole('textbox', { name: 'Email' })

// Checkbox by label
page.getByRole('checkbox', { name: 'I agree' })

// Heading
page.getByRole('heading', { name: 'Welcome', level: 1 })

// List and list items
page.getByRole('list')
page.getByRole('listitem')

// Table elements
page.getByRole('table')
page.getByRole('row')
page.getByRole('cell')
page.getByRole('columnheader')
```

### Text-based Locators
```javascript
// Exact text match
page.getByText('Welcome to our site')

// Partial text match
page.getByText('Welcome', { exact: false })

// Regex match
page.getByText(/welcome/i)

// Text within specific element
page.locator('nav').getByText('Home')
```

### Form Locators
```javascript
// By label text
page.getByLabel('Email address')
page.getByLabel(/email/i)

// By placeholder
page.getByPlaceholder('Enter your email')

// By alt text (images)
page.getByAltText('Company logo')

// By title attribute
page.getByTitle('More information')
```

### Test ID Locators
```javascript
// Most reliable for testing
page.getByTestId('submit-form')
page.getByTestId('user-menu')

// Configure custom test id attribute
// In playwright.config.js:
use: {
  testIdAttribute: 'data-qa'
}
// Then use: <button data-qa="submit">Submit</button>
```

### CSS and XPath Locators
```javascript
// CSS selectors (use sparingly)
page.locator('css=.submit-button')
page.locator('[data-test="submit"]')
page.locator('button:has-text("Submit")')

// XPath (use as last resort)
page.locator('xpath=//button[contains(text(), "Submit")]')
page.locator('//div[@class="container"]//button')
```

## Locator Chaining and Filtering

### Chaining Locators
```javascript
// Find button within article
page.locator('article').getByRole('button', { name: 'Read more' })

// Multiple levels
page.locator('.sidebar').locator('.menu').getByRole('link')
```

### Filtering Locators
```javascript
// Filter by text content
page.getByRole('button').filter({ hasText: 'Delete' })

// Filter by containing another element
page.getByRole('listitem').filter({
  has: page.getByRole('button', { name: 'Edit' })
})

// Filter by not containing
page.getByRole('listitem').filter({
  hasNot: page.getByText('Completed')
})
```

### Locator Utilities
```javascript
// Get count
const count = await page.getByRole('button').count();

// Get specific instances
page.getByRole('button').first()
page.getByRole('button').last()
page.getByRole('button').nth(2) // Zero-indexed

// Get all elements
const buttons = await page.getByRole('button').all();
for (const button of buttons) {
  await button.click();
}
```

## Assertions

### Element State Assertions
```javascript
// Visibility
await expect(page.getByText('Welcome')).toBeVisible();
await expect(page.getByText('Loading')).toBeHidden();

// Attachment to DOM
await expect(page.getByTestId('modal')).toBeAttached();
await expect(page.getByTestId('modal')).not.toBeAttached();

// Enabled/Disabled state
await expect(page.getByRole('button')).toBeEnabled();
await expect(page.getByRole('button')).toBeDisabled();

// Checked state
await expect(page.getByRole('checkbox')).toBeChecked();
await expect(page.getByRole('checkbox')).not.toBeChecked();

// Focus state
await expect(page.getByRole('textbox')).toBeFocused();

// Editable state
await expect(page.getByRole('textbox')).toBeEditable();
await expect(page.getByRole('textbox')).not.toBeEditable();
```

### Text and Content Assertions
```javascript
// Text content
await expect(page.getByTestId('title')).toHaveText('Welcome');
await expect(page.getByTestId('title')).toHaveText(/welcome/i);

// Partial text
await expect(page.getByTestId('message')).toContainText('Success');

// Inner text vs text content
await expect(page.locator('.title')).toHaveText('Title'); // innerText
await expect(page.locator('.title')).toContainText('Title');

// Input values
await expect(page.getByRole('textbox')).toHaveValue('user@example.com');
await expect(page.getByRole('textbox')).toHaveValue(/user@/);

// Placeholder text
await expect(page.getByRole('textbox')).toHaveAttribute('placeholder', 'Email');
```

### Count Assertions
```javascript
// Element count
await expect(page.getByRole('listitem')).toHaveCount(5);
await expect(page.getByRole('button')).toHaveCount(0); // No buttons

// At least/at most
await expect(page.locator('.item')).toHaveCountGreaterThan(3);
await expect(page.locator('.item')).toHaveCountLessThan(10);
```

### Attribute and CSS Assertions
```javascript
// Attributes
await expect(page.getByRole('link')).toHaveAttribute('href', '/home');
await expect(page.getByRole('link')).toHaveAttribute('href', /\/home/);

// CSS classes
await expect(page.getByTestId('button')).toHaveClass('btn btn-primary');
await expect(page.getByTestId('button')).toHaveClass(/btn-primary/);

// CSS properties
await expect(page.getByTestId('element')).toHaveCSS('color', 'rgb(255, 0, 0)');
await expect(page.getByTestId('element')).toHaveCSS('display', 'none');
```

### Page-level Assertions
```javascript
// Page URL
await expect(page).toHaveURL('https://example.com/dashboard');
await expect(page).toHaveURL(/dashboard/);

// Page title
await expect(page).toHaveTitle('Dashboard - MyApp');
await expect(page).toHaveTitle(/Dashboard/);

// Screenshot comparison
await expect(page).toHaveScreenshot('dashboard.png');
await expect(page.getByTestId('chart')).toHaveScreenshot('chart.png');
```

### Custom Assertions with Polling
```javascript
// Wait for custom conditions
await expect(async () => {
  const response = await page.request.get('/api/status');
  expect(response.status()).toBe(200);
}).toPass({
  timeout: 30000,
  intervals: [1000, 2000, 5000]
});
```

### Soft Assertions
```javascript
// Continue test execution even if assertion fails
await expect.soft(page.getByTestId('title')).toHaveText('Expected');
await expect.soft(page.getByTestId('count')).toHaveText('5');

// Regular assertion (will stop test if it fails)
await expect(page.getByTestId('critical')).toBeVisible();
```

## Advanced Locator Patterns

### Dynamic Content
```javascript
// Wait for dynamic content
await page.getByText('Loading...').waitFor({ state: 'detached' });
await page.getByText('Data loaded').waitFor({ state: 'visible' });

// Retry with polling
await expect(page.getByTestId('dynamic-content')).toHaveText('Updated', {
  timeout: 10000
});
```

### Complex Selections
```javascript
// Select row by cell content
const row = page.getByRole('row').filter({
  has: page.getByRole('cell', { name: 'John Doe' })
});
await row.getByRole('button', { name: 'Edit' }).click();

// Select option by text
await page.getByRole('combobox').selectOption({ label: 'Option 1' });
```