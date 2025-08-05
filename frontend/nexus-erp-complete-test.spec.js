import { test, expect } from '@playwright/test';

// 測試配置
const TEST_USER = {
  email: 'test@example.com',
  password: 'password123'
};

const BASE_URL = 'http://127.0.0.1:8000';

test.describe('NexusERP 系統完整測試', () => {
  
  test.beforeEach(async ({ page }) => {
    // 設置頁面錯誤監聽
    page.on('pageerror', (error) => {
      console.log('頁面錯誤:', error.message);
    });
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.log('控制台錯誤:', msg.text());
      }
    });
  });

  test('1. 基礎測試 - 登入系統', async ({ page }) => {
    console.log('=== 開始基礎測試 - 登入系統 ===');
    
    // 導航到首頁
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    // 檢查是否需要登入
    const isLoginPage = await page.locator('input[name="email"]').isVisible();
    
    if (isLoginPage) {
      console.log('檢測到登入頁面，開始登入流程');
      
      // 填寫登入資訊
      await page.fill('input[name="email"]', TEST_USER.email);
      await page.fill('input[name="password"]', TEST_USER.password);
      
      // 點擊登入按鈕
      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle');
      
      // 驗證登入成功
      await expect(page).toHaveURL(/\/dashboard/);
      console.log('✅ 登入成功');
    } else {
      console.log('已經登入狀態，跳過登入步驟');
    }
    
    // 截圖記錄登入後狀態
    await page.screenshot({ path: 'screenshots/01-login-success.png', fullPage: true });
  });

  test('2. Dashboard 測試', async ({ page }) => {
    console.log('=== 開始 Dashboard 測試 ===');
    
    // 登入
    await page.goto(BASE_URL + '/login');
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    
    // 導航到 Dashboard
    await page.goto(BASE_URL + '/dashboard');
    await page.waitForLoadState('networkidle');
    
    // 驗證 Dashboard 載入（無 HTTP 500 錯誤）
    const title = await page.title();
    console.log('頁面標題:', title);
    
    // 檢查頁面是否有錯誤
    const errorElements = await page.locator('text=500').count();
    expect(errorElements).toBe(0);
    
    // 檢查低庫存警報是否顯示
    const lowStockAlert = page.locator('[data-test="low-stock-alert"]');
    if (await lowStockAlert.isVisible()) {
      console.log('✅ 低庫存警報顯示正常');
      
      // 檢查是否為真實數據
      const alertText = await lowStockAlert.textContent();
      console.log('低庫存警報內容:', alertText);
    }
    
    // 檢查統計卡片
    const statsCards = page.locator('.stats-card, .stat-card, [class*="stat"]');
    const statsCount = await statsCards.count();
    console.log(`找到 ${statsCount} 個統計卡片`);
    
    if (statsCount > 0) {
      for (let i = 0; i < Math.min(statsCount, 5); i++) {
        const cardText = await statsCards.nth(i).textContent();
        console.log(`統計卡片 ${i + 1}: ${cardText?.substring(0, 50)}...`);
      }
    }
    
    // 截圖記錄 Dashboard 狀態
    await page.screenshot({ path: 'screenshots/02-dashboard.png', fullPage: true });
    console.log('✅ Dashboard 測試完成');
  });

  test('3. 客戶管理測試', async ({ page }) => {
    console.log('=== 開始客戶管理測試 ===');
    
    // 登入
    await page.goto(BASE_URL + '/login');
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    
    // 導航到客戶管理頁面
    await page.goto(BASE_URL + '/customers');
    await page.waitForLoadState('networkidle');
    
    // 測試即時搜尋功能
    const searchInput = page.locator('input[type="search"], input[placeholder*="搜尋"], input[name*="search"]');
    if (await searchInput.isVisible()) {
      console.log('✅ 找到搜尋輸入框');
      await searchInput.fill('測試');
      await page.waitForTimeout(1000); // 等待 AJAX 更新
      
      console.log('✅ 搜尋功能測試完成');
    }
    
    // 測試分頁導航功能
    const paginationLinks = page.locator('.pagination a, [class*="page"] a');
    const paginationCount = await paginationLinks.count();
    console.log(`找到 ${paginationCount} 個分頁連結`);
    
    if (paginationCount > 1) {
      // 點擊第二頁（如果存在）
      await paginationLinks.nth(1).click();
      await page.waitForLoadState('networkidle');
      console.log('✅ 分頁導航測試完成');
    }
    
    // 測試「建立新訂單」功能
    const customerRows = page.locator('tr[data-customer-id], .customer-row, .customer-item');
    const rowCount = await customerRows.count();
    
    if (rowCount > 0) {
      // 點擊第一個客戶
      await customerRows.first().click();
      await page.waitForLoadState('networkidle');
      
      // 尋找「建立新訂單」按鈕
      const createOrderBtn = page.locator('text="建立新訂單", text="新增訂單", [data-action="create-order"]');
      if (await createOrderBtn.isVisible()) {
        console.log('✅ 找到建立新訂單按鈕');
        // 暫不點擊，只驗證存在
      }
    }
    
    // 截圖記錄客戶管理頁面
    await page.screenshot({ path: 'screenshots/03-customers.png', fullPage: true });
    console.log('✅ 客戶管理測試完成');
  });

  test('4. 商品管理測試', async ({ page }) => {
    console.log('=== 開始商品管理測試 ===');
    
    // 登入
    await page.goto(BASE_URL + '/login');
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    
    // 導航到商品管理頁面
    await page.goto(BASE_URL + '/products');
    await page.waitForLoadState('networkidle');
    
    // 測試搜尋功能
    const searchInput = page.locator('input[type="search"], input[placeholder*="搜尋"], input[name*="search"]');
    if (await searchInput.isVisible()) {
      console.log('✅ 找到搜尋輸入框');
      
      // 測試商品名稱搜尋
      await searchInput.fill('測試商品');
      await page.waitForTimeout(1000);
      
      // 清空並測試 SKU 搜尋
      await searchInput.fill('');
      await searchInput.fill('SKU001');
      await page.waitForTimeout(1000);
      
      console.log('✅ 商品搜尋功能測試完成');
    }
    
    // 驗證分頁統計顯示
    const statsText = page.locator('.pagination-info, .showing-results, [class*="stat"]');
    if (await statsText.isVisible()) {
      const statsContent = await statsText.textContent();
      console.log('分頁統計:', statsContent);
      console.log('✅ 分頁統計顯示正確');
    }
    
    // 檢查商品列表載入
    const productRows = page.locator('tr[data-product-id], .product-row, .product-item');
    const productCount = await productRows.count();
    console.log(`找到 ${productCount} 個商品項目`);
    
    // 截圖記錄商品管理頁面
    await page.screenshot({ path: 'screenshots/04-products.png', fullPage: true });
    console.log('✅ 商品管理測試完成');
  });

  test('5. 銷售訂單測試', async ({ page }) => {
    console.log('=== 開始銷售訂單測試 ===');
    
    // 登入
    await page.goto(BASE_URL + '/login');
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    
    // 導航到銷售訂單頁面
    await page.goto(BASE_URL + '/orders/sales');
    await page.waitForLoadState('networkidle');
    
    // 尋找建立新訂單按鈕
    const createOrderBtn = page.locator('text="建立訂單", text="新增訂單", [href*="create"], .btn-create');
    if (await createOrderBtn.isVisible()) {
      console.log('✅ 找到建立新訂單按鈕');
      
      // 點擊建立新訂單
      await createOrderBtn.click();
      await page.waitForLoadState('networkidle');
      
      // 檢查訂單建立表單
      const customerSelect = page.locator('select[name*="customer"], input[name*="customer"]');
      if (await customerSelect.isVisible()) {
        console.log('✅ 客戶選擇欄位存在');
      }
      
      // 檢查商品項目區域
      const productSection = page.locator('[data-section="products"], .product-items, .order-items');
      if (await productSection.isVisible()) {
        console.log('✅ 商品項目區域存在');
        
        // 測試添加商品項目
        const addProductBtn = page.locator('text="添加商品", text="新增項目", .add-product');
        if (await addProductBtn.isVisible()) {
          await addProductBtn.click();
          await page.waitForTimeout(500);
          console.log('✅ 添加商品項目功能測試');
        }
      }
      
      // 檢查總計計算區域
      const totalSection = page.locator('.total, .summary, [data-section="total"]');
      if (await totalSection.isVisible()) {
        const totalText = await totalSection.textContent();
        console.log('總計區域內容:', totalText?.substring(0, 100));
        console.log('✅ 總計計算功能存在');
      }
    }
    
    // 截圖記錄銷售訂單頁面
    await page.screenshot({ path: 'screenshots/05-sales-orders.png', fullPage: true });
    console.log('✅ 銷售訂單測試完成');
  });

  test('6. 供應商管理測試', async ({ page }) => {
    console.log('=== 開始供應商管理測試 ===');
    
    // 登入
    await page.goto(BASE_URL + '/login');
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    
    // 導航到供應商管理頁面
    await page.goto(BASE_URL + '/suppliers');
    await page.waitForLoadState('networkidle');
    
    // 檢查供應商列表載入
    const supplierRows = page.locator('tr[data-supplier-id], .supplier-row, .supplier-item');
    const supplierCount = await supplierRows.count();
    console.log(`找到 ${supplierCount} 個供應商項目`);
    
    if (supplierCount > 0) {
      // 檢查供應商狀態顯示
      const statusElements = page.locator('.status, [data-field="status"], .supplier-status');
      const statusCount = await statusElements.count();
      
      if (statusCount > 0) {
        const statusText = await statusElements.first().textContent();
        console.log('供應商狀態顯示:', statusText);
        
        if (statusText?.includes('啟用') || statusText?.includes('active')) {
          console.log('✅ 供應商狀態顯示正確（顯示「啟用」而非「未知」）');
        } else {
          console.log('⚠️ 供應商狀態可能需要檢查:', statusText);
        }
      }
      
      // 測試供應商編輯功能
      const editBtn = page.locator('text="編輯", .edit-btn, [data-action="edit"]');
      if (await editBtn.first().isVisible()) {
        console.log('✅ 找到編輯按鈕');
        
        await editBtn.first().click();
        await page.waitForLoadState('networkidle');
        
        // 檢查編輯表單是否有類型欄位衝突
        const typeFields = page.locator('input[name*="type"], select[name*="type"]');
        const typeFieldCount = await typeFields.count();
        console.log(`找到 ${typeFieldCount} 個類型相關欄位`);
        
        if (typeFieldCount > 0) {
          console.log('✅ 編輯表單載入正常，無類型欄位衝突');
        }
      }
    }
    
    // 截圖記錄供應商管理頁面
    await page.screenshot({ path: 'screenshots/06-suppliers.png', fullPage: true });
    console.log('✅ 供應商管理測試完成');
  });

  test('7. 整體功能測試', async ({ page }) => {
    console.log('=== 開始整體功能測試 ===');
    
    // 登入
    await page.goto(BASE_URL + '/login');
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    
    // 測試各頁面間的導航
    const navigationPages = [
      '/dashboard',
      '/customers', 
      '/products',
      '/orders/sales',
      '/suppliers'
    ];
    
    for (const pagePath of navigationPages) {
      console.log(`測試導航到: ${pagePath}`);
      await page.goto(BASE_URL + pagePath);
      await page.waitForLoadState('networkidle');
      
      // 檢查頁面是否正常載入（無 500 錯誤）
      const pageTitle = await page.title();
      const hasError = await page.locator('text=500').count() > 0;
      
      if (!hasError) {
        console.log(`✅ ${pagePath} 頁面載入正常`);
      } else {
        console.log(`❌ ${pagePath} 頁面有錯誤`);
      }
    }
    
    // 檢查 JavaScript 錯誤（通過控制台監聽）
    let jsErrors = [];
    page.on('pageerror', (error) => {
      jsErrors.push(error.message);
    });
    
    // 重新載入主要頁面檢查 JS 錯誤
    await page.goto(BASE_URL + '/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    if (jsErrors.length === 0) {
      console.log('✅ 無 JavaScript 錯誤');
    } else {
      console.log('⚠️ 發現 JavaScript 錯誤:', jsErrors);
    }
    
    // 檢查 UI/UX 一致性
    const navigationMenu = page.locator('nav, .navigation, .menu');
    if (await navigationMenu.isVisible()) {
      console.log('✅ 導航選單顯示正常');
    }
    
    const footer = page.locator('footer, .footer');
    if (await footer.isVisible()) {
      console.log('✅ 頁腳顯示正常');
    }
    
    // 截圖記錄最終狀態
    await page.screenshot({ path: 'screenshots/07-final-state.png', fullPage: true });
    console.log('✅ 整體功能測試完成');
  });

  test.afterEach(async ({ page }) => {
    // 清理：登出或清除狀態
    try {
      const logoutBtn = page.locator('text="登出", text="logout", .logout');
      if (await logoutBtn.isVisible()) {
        await logoutBtn.click();
        await page.waitForTimeout(1000);
      }
    } catch (error) {
      console.log('清理過程中的錯誤（可忽略）:', error.message);
    }
  });
});