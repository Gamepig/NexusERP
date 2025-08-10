const { chromium } = require('playwright');

/**
 * Settings Module Nested Routes Test
 * 測試設定模組的巢狀路由和佈局功能
 */

async function testSettingsModuleRoutes() {
    const browser = await chromium.launch({
        headless: false,
        slowMo: 1000 // 放慢操作便於觀察
    });
    
    try {
        const context = await browser.newContext();
        const page = await context.newPage();
        
        console.log('開始測試 Settings 模組巢狀路由...');

  test('should redirect /settings to /settings/company', async ({ page }) => {
    // 導航到 /settings
    await page.goto('/settings');
    
    // 驗證自動重定向到 /settings/company
    await expect(page).toHaveURL('/settings/company');
    
    // 驗證頁面標題
    await expect(page).toHaveTitle(/系統設定/);
    
    // 驗證 SettingsLayout 存在
    const settingsLayout = page.locator('[data-testid="settings-layout"]');
    await expect(settingsLayout).toBeVisible();
  });

  test('should navigate to settings company page correctly', async ({ page }) => {
    await page.goto('/settings/company');
    
    // 驗證公司設定頁面已載入
    const companyPage = page.locator('[data-testid="company-settings-page"]');
    await expect(companyPage).toBeVisible();
    
    // 驗證頁面標題
    await expect(page.locator('h2')).toContainText('公司資訊');
    
    // 驗證表單存在
    const companyForm = page.locator('[data-testid="company-form"]');
    await expect(companyForm).toBeVisible();
    
    // 驗證導航項目高亮顯示
    const companyNav = page.locator('[data-testid="company-nav"]');
    await expect(companyNav).toHaveClass(/bg-blue-50/);
  });

  test('should navigate to settings units page correctly', async ({ page }) => {
    await page.goto('/settings/units');
    
    // 驗證計量單位頁面已載入
    const unitsPage = page.locator('[data-testid="units-settings-page"]');
    await expect(unitsPage).toBeVisible();
    
    // 驗證頁面標題
    await expect(page.locator('h2')).toContainText('計量單位管理');
    
    // 驗證表格存在
    const unitsTable = page.locator('[data-testid="units-table"]');
    await expect(unitsTable).toBeVisible();
    
    // 驗證導航項目高亮顯示
    const unitsNav = page.locator('[data-testid="units-nav"]');
    await expect(unitsNav).toHaveClass(/bg-blue-50/);
  });

  test('should navigate to settings categories page correctly', async ({ page }) => {
    await page.goto('/settings/categories');
    
    // 驗證產品類別頁面已載入
    const categoriesPage = page.locator('[data-testid="categories-settings-page"]');
    await expect(categoriesPage).toBeVisible();
    
    // 驗證頁面標題
    await expect(page.locator('h2')).toContainText('產品類別管理');
    
    // 驗證類別樹狀結構存在
    const categoriesTree = page.locator('[data-testid="categories-tree"]');
    await expect(categoriesTree).toBeVisible();
    
    // 驗證導航項目高亮顯示
    const categoriesNav = page.locator('[data-testid="categories-nav"]');
    await expect(categoriesNav).toHaveClass(/bg-blue-50/);
  });

  test('should navigate to settings permissions page correctly', async ({ page }) => {
    await page.goto('/settings/permissions');
    
    // 驗證權限管理頁面已載入
    const permissionsPage = page.locator('[data-testid="permissions-settings-page"]');
    await expect(permissionsPage).toBeVisible();
    
    // 驗證頁面標題
    await expect(page.locator('h2')).toContainText('使用者權限管理');
    
    // 驗證權限統計卡片存在
    const totalUsersCard = page.locator('[data-testid="total-users-card"]');
    await expect(totalUsersCard).toBeVisible();
    
    // 驗證導航項目高亮顯示
    const permissionsNav = page.locator('[data-testid="permissions-nav"]');
    await expect(permissionsNav).toHaveClass(/bg-blue-50/);
  });

  test('should maintain shared layout across all settings pages', async ({ page }) => {
    const pages = [
      { url: '/settings/company', testId: 'company-settings-page' },
      { url: '/settings/units', testId: 'units-settings-page' },
      { url: '/settings/categories', testId: 'categories-settings-page' },
      { url: '/settings/permissions', testId: 'permissions-settings-page' }
    ];

    for (const pageData of pages) {
      await page.goto(pageData.url);
      
      // 驗證共用佈局元素存在
      const settingsLayout = page.locator('[data-testid="settings-layout"]');
      await expect(settingsLayout).toBeVisible();
      
      // 驗證側邊導航存在
      const companyNav = page.locator('[data-testid="company-nav"]');
      const unitsNav = page.locator('[data-testid="units-nav"]');
      const categoriesNav = page.locator('[data-testid="categories-nav"]');
      const permissionsNav = page.locator('[data-testid="permissions-nav"]');
      
      await expect(companyNav).toBeVisible();
      await expect(unitsNav).toBeVisible();
      await expect(categoriesNav).toBeVisible();
      await expect(permissionsNav).toBeVisible();
      
      // 驗證特定頁面內容存在
      const pageContent = page.locator(`[data-testid="${pageData.testId}"]`);
      await expect(pageContent).toBeVisible();
    }
  });

  test('should allow navigation between settings pages via sidebar', async ({ page }) => {
    // 開始於公司設定頁面
    await page.goto('/settings/company');
    await expect(page.locator('[data-testid="company-settings-page"]')).toBeVisible();
    
    // 點擊計量單位導航
    await page.click('[data-testid="units-nav"]');
    await expect(page).toHaveURL('/settings/units');
    await expect(page.locator('[data-testid="units-settings-page"]')).toBeVisible();
    
    // 點擊產品類別導航
    await page.click('[data-testid="categories-nav"]');
    await expect(page).toHaveURL('/settings/categories');
    await expect(page.locator('[data-testid="categories-settings-page"]')).toBeVisible();
    
    // 點擊權限管理導航
    await page.click('[data-testid="permissions-nav"]');
    await expect(page).toHaveURL('/settings/permissions');
    await expect(page.locator('[data-testid="permissions-settings-page"]')).toBeVisible();
    
    // 回到公司設定
    await page.click('[data-testid="company-nav"]');
    await expect(page).toHaveURL('/settings/company');
    await expect(page.locator('[data-testid="company-settings-page"]')).toBeVisible();
  });

  test('should display correct page titles and breadcrumbs', async ({ page }) => {
    const pageTests = [
      {
        url: '/settings/company',
        pageTitle: '公司資訊',
        breadcrumb: '設定您的公司基本資訊和聯絡方式'
      },
      {
        url: '/settings/units',
        pageTitle: '計量單位管理',
        breadcrumb: '管理產品計量單位，支援多種單位換算'
      },
      {
        url: '/settings/categories',
        pageTitle: '產品類別管理',
        breadcrumb: '管理產品分類架構，支援層級分類和自訂屬性'
      },
      {
        url: '/settings/permissions',
        pageTitle: '使用者權限管理',
        breadcrumb: '管理使用者角色、權限設定和存取控制'
      }
    ];

    for (const test of pageTests) {
      await page.goto(test.url);
      
      // 驗證頁面標題
      await expect(page.locator('h2').first()).toContainText(test.pageTitle);
      
      // 驗證麵包屑描述
      await expect(page.locator('p').first()).toContainText(test.breadcrumb);
    }
  });

  test('should handle form interactions correctly', async ({ page }) => {
    // 測試公司設定表單
    await page.goto('/settings/company');
    
    const companyNameInput = page.locator('[data-testid="company-name-input"]');
    const saveButton = page.locator('[data-testid="save-button"]');
    
    // 填寫表單
    await companyNameInput.fill('測試公司名稱');
    
    // 點擊儲存按鈕
    await saveButton.click();
    
    // 驗證表單提交（這裡會顯示 alert，因為是測試模式）
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('公司資訊設定已儲存');
      await dialog.accept();
    });
  });

  test('should handle modal interactions in units page', async ({ page }) => {
    await page.goto('/settings/units');
    
    // 點擊新增計量單位按鈕
    const addUnitButton = page.locator('[data-testid="add-unit-button"]');
    await addUnitButton.click();
    
    // 驗證模態框打開
    const unitModal = page.locator('[data-testid="unit-modal"]');
    await expect(unitModal).not.toHaveClass(/hidden/);
    
    // 填寫表單
    await page.fill('[data-testid="unit-name-input"]', '測試單位');
    await page.fill('[data-testid="unit-symbol-input"]', 'TU');
    await page.selectOption('[data-testid="unit-category-input"]', 'weight');
    
    // 提交表單
    await page.click('[data-testid="save-unit-button"]');
    
    // 驗證表單提交
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('計量單位已儲存');
      await dialog.accept();
    });
  });

  test('should handle permission checks correctly', async ({ page }) => {
    // 這個測試假設權限檢查已實施
    await page.goto('/settings/permissions');
    
    // 驗證權限相關元素存在
    const permissionMatrix = page.locator('[data-testid="permission-matrix"]');
    await expect(permissionMatrix).toBeVisible();
    
    // 驗證統計卡片資料
    const totalUsersCard = page.locator('[data-testid="total-users-card"]');
    const totalRolesCard = page.locator('[data-testid="total-roles-card"]');
    
    await expect(totalUsersCard).toContainText('47');
    await expect(totalRolesCard).toContainText('8');
  });

  test('should handle error states gracefully', async ({ page }) => {
    // 測試無效的路由
    const response = await page.goto('/settings/invalid-page');
    
    // 驗證 404 處理或重定向
    // 根據應用的實際行為調整這個測試
    expect(response?.status()).toBe(404);
  });

  test('should maintain responsive layout on mobile devices', async ({ page }) => {
    // 設定為手機視窗大小
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/settings/company');
    
    // 驗證響應式佈局
    const settingsLayout = page.locator('[data-testid="settings-layout"]');
    await expect(settingsLayout).toBeVisible();
    
    // 驗證內容在小螢幕上仍然可見
    const companyForm = page.locator('[data-testid="company-form"]');
    await expect(companyForm).toBeVisible();
  });

});

// 驗證權限檢查功能的獨立測試組
test.describe('Settings Module Permission Checks', () => {
  
  test('should enforce permission requirements for settings access', async ({ page }) => {
    // 這個測試需要實際的權限系統實施後才能正確執行
    // 目前作為框架保留
    
    // 假設沒有適當權限的使用者嘗試存取設定
    // await page.goto('/login');
    // await page.fill('input[name="email"]', 'limited@example.com');
    // await page.fill('input[name="password"]', 'password123');
    // await page.click('button[type="submit"]');
    
    // const response = await page.goto('/settings');
    // expect(response?.status()).toBe(403);
    
    console.log('Permission checks will be implemented when RBAC system is ready');
  });

});

// 效能測試組
test.describe('Settings Module Performance', () => {
  
  test('should load settings pages within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/settings/company');
    
    // 等待頁面完全載入
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // 驗證載入時間在 3 秒內
    expect(loadTime).toBeLessThan(3000);
    
    console.log(`Settings company page loaded in ${loadTime}ms`);
  });

});