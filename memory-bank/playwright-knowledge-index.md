# Playwright Knowledge Base Index

This comprehensive Playwright knowledge base contains detailed documentation for AI agents to effectively use Playwright for web automation and testing tasks.

## 📚 Knowledge Base Contents

### 1. [Installation and Setup](./playwright-installation-setup.md)
- Node.js, Python, and Docker installation methods
- Project configuration with playwright.config.js
- Environment setup and browser installation
- Common setup issues and solutions
- TypeScript configuration

### 2. [Core Concepts](./playwright-core-concepts.md)
- Browser contexts and pages
- Auto-waiting and actionability checks
- Basic actions (navigation, clicking, text input)
- State management (cookies, local storage)
- Mobile and device emulation
- Error handling patterns

### 3. [Locators and Assertions](./playwright-locators-assertions.md)
- Recommended locator strategies (role-based, text-based, test-id)
- Locator chaining and filtering
- Element state assertions (visibility, enabled, checked)
- Text and content assertions
- Count and attribute assertions
- Page-level assertions
- Custom and soft assertions

### 4. [API Reference](./playwright-api-reference.md)
- Complete Page class methods (navigation, interaction, content retrieval)
- Locator class methods (actions, information retrieval, state checks)
- Browser context API
- Keyboard, mouse, and touch APIs
- Evaluation and script execution
- Dialog and screenshot handling

### 5. [Test Writing Patterns](./playwright-test-patterns.md)
- Test structure and organization
- Page Object Model (POM) implementation
- Data-driven testing patterns
- Custom fixtures and utilities
- Error handling and debugging techniques
- Advanced testing patterns (steps, cross-browser, mobile)
- Performance monitoring

### 6. [Advanced Features](./playwright-advanced-features.md)
- Visual debugging with Playwright Inspector
- Tracing and recording configuration
- Code generation (codegen) usage
- API testing integration
- Performance testing and metrics
- Browser context manipulation
- Multiple contexts and state management

### 7. [Configuration and CI/CD](./playwright-configuration-ci.md)
- Complete configuration file examples
- Reporter configuration (HTML, JSON, custom)
- GitHub Actions, GitLab CI, Jenkins integration
- Environment variables and configuration
- Global setup and teardown
- Test sharding and parallel execution
- Test organization and filtering

### 8. [Network Handling and Mocking](./playwright-network-mocking.md)
- Request interception and routing
- Response mocking and modification
- Dynamic and conditional mocking
- File-based mocks
- Network monitoring and failure testing
- Authentication flow mocking
- WebSocket and GraphQL mocking

### 9. [Authentication Patterns](./playwright-authentication-patterns.md)
- Global authentication setup
- Multiple user authentication
- Authentication helpers and utilities
- OAuth and social authentication
- Token-based authentication (JWT, API keys)
- Session and cookie-based authentication
- Multi-factor authentication (MFA)
- Role-based access testing

### 10. [Parallel Testing and Fixtures](./playwright-parallel-testing-fixtures.md)
- Parallel testing configuration
- Worker management and isolation
- Custom fixtures (database, API, page objects)
- Advanced fixture patterns and dependencies
- Worker-scoped fixtures
- Test execution patterns
- Best practices for avoiding test interference

### 11. [Docker Integration](./playwright-docker-integration.md)
- Docker setup for Playwright
- Multi-stage Dockerfiles
- Docker Compose configurations
- CI/CD Docker integration
- Parallel testing with containers
- Environment-specific configurations
- Docker best practices and optimization

## 🎯 Key Usage Patterns

### Quick Start Pattern
```javascript
import { test, expect } from '@playwright/test';

test('basic test', async ({ page }) => {
  await page.goto('https://example.com');
  await page.getByRole('button', { name: 'Click me' }).click();
  await expect(page.getByText('Success')).toBeVisible();
});
```

### Page Object Pattern
```javascript
class LoginPage {
  constructor(page) {
    this.page = page;
    this.emailInput = page.getByLabel('Email');
    this.passwordInput = page.getByLabel('Password');
    this.loginButton = page.getByRole('button', { name: 'Login' });
  }

  async login(email, password) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }
}
```

### Custom Fixture Pattern
```javascript
export const test = base.extend({
  authenticatedPage: async ({ page }, use) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('password');
    await page.getByRole('button', { name: 'Login' }).click();
    await use(page);
  }
});
```

## 🛠️ Best Practices Summary

### Locator Strategy
1. Use role-based locators (`getByRole`) as first choice
2. Use test-id attributes (`getByTestId`) for reliable element identification
3. Avoid CSS selectors and XPath when possible
4. Chain locators for specificity

### Test Organization
1. Use Page Object Model for complex applications
2. Create reusable fixtures for common setup
3. Isolate test data to avoid interference
4. Use proper test hooks for setup and cleanup

### Debugging
1. Use `page.pause()` for interactive debugging
2. Enable tracing for failed tests
3. Take screenshots on failures
4. Use Playwright Inspector for step-by-step debugging

### CI/CD Integration
1. Use Docker for consistent environments
2. Configure proper retry strategies
3. Implement test sharding for faster execution
4. Store artifacts (reports, traces, screenshots)

## 🔍 Search and Reference

Use this knowledge base by searching for specific topics:
- **Installation issues**: Check [Installation and Setup](./playwright-installation-setup.md)
- **Locator problems**: Refer to [Locators and Assertions](./playwright-locators-assertions.md)
- **API questions**: See [API Reference](./playwright-api-reference.md)
- **Test patterns**: Review [Test Writing Patterns](./playwright-test-patterns.md)
- **Authentication setup**: Check [Authentication Patterns](./playwright-authentication-patterns.md)
- **Performance issues**: See [Advanced Features](./playwright-advanced-features.md)
- **CI/CD setup**: Refer to [Configuration and CI/CD](./playwright-configuration-ci.md)

This knowledge base provides comprehensive coverage of Playwright functionality, patterns, and best practices for effective web automation and testing.