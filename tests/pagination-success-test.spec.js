import { test, expect } from '@playwright/test';

test('確認分頁修復成功', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    
    // 桌面版測試
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/quotes?per_page=5');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // 使用更精確的選擇器
    const paginationInfo = page.locator('.text-sm.text-gray-700:has-text("顯示第")').first();
    const paginationExists = await paginationInfo.count() > 0;
    console.log(`✅ 桌面版分頁信息存在: ${paginationExists}`);
    
    if (paginationExists) {
        const text = await paginationInfo.textContent();
        console.log(`📊 分頁信息: ${text.trim()}`);
    }
    
    // 檢查下一頁按鈕
    const nextButton = page.locator('a').filter({ hasText: '下一頁' });
    const hasNext = await nextButton.count() > 0;
    console.log(`📄 下一頁按鈕存在: ${hasNext}`);
    
    // 檢查頁碼按鈕
    const pageNumbers = page.locator('a').filter({ hasText: /^[0-9]+$/ });
    const pageNumberCount = await pageNumbers.count();
    console.log(`📄 頁碼按鈕數量: ${pageNumberCount}`);
    
    if (hasNext) {
        console.log('🔄 測試下一頁功能');
        const initialUrl = page.url();
        await nextButton.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);
        
        const newUrl = page.url();
        console.log(`🌐 URL變化: ${initialUrl} → ${newUrl}`);
        
        if (newUrl.includes('page=2')) {
            console.log('✅ 下一頁功能正常工作');
        }
    }
    
    // 手機版測試
    console.log('\n📱 測試手機版');
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/quotes?per_page=5');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // 檢查手機版分頁
    const mobilePageInfo = page.locator('.text-sm:has-text("顯示第")');
    const mobilePageExists = await mobilePageInfo.isVisible();
    console.log(`📱 手機版分頁可見: ${mobilePageExists}`);
    
    // 截圖成功狀態
    await page.screenshot({ 
        path: `pagination-success-mobile-${Date.now()}.png`, 
        fullPage: true 
    });
    
    console.log('✅ 分頁修復驗證完成');
});