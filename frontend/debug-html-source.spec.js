import { test, expect } from '@playwright/test';
import fs from 'fs';

test('檢查銷售報表 HTML 源碼', async ({ page }) => {
    console.log('🔍 檢查 HTML 源碼...');
    
    // 登入
    await page.goto('http://127.0.0.1:8000/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard/);

    // 訪問銷售報表頁面
    await page.goto('http://127.0.0.1:8000/reports/sales');
    await page.waitForTimeout(2000);

    // 獲取完整的 HTML 源碼
    const htmlContent = await page.content();
    
    // 儲存 HTML 內容到檔案
    fs.writeFileSync('/Users/gamepig/projects/NexusERP/frontend/debug-sales-report-source.html', htmlContent);
    
    console.log('📄 HTML 源碼長度:', htmlContent.length);
    
    // 檢查是否包含錯誤的語法
    const suspiciousPatterns = [
        /\+\+[^a-zA-Z_$]/g,
        /--[^a-zA-Z_$]/g,
        /\+\+$/g,
        /--$/g,
        /\+\+\s*;/g,
        /--\s*;/g
    ];
    
    suspiciousPatterns.forEach((pattern, index) => {
        const matches = htmlContent.match(pattern);
        if (matches) {
            console.log(`🚨 找到可疑模式 ${index + 1}:`, matches);
        }
    });
    
    // 檢查是否有不正確的 CSS 變數語法
    const cssVariablePattern = /var\(--(.*?)\)/g;
    const cssMatches = htmlContent.match(cssVariablePattern);
    if (cssMatches) {
        console.log('🎨 CSS 變數數量:', cssMatches.length);
        console.log('🎨 前 10 個 CSS 變數:', cssMatches.slice(0, 10));
    }
    
    // 檢查 script 標籤
    const scriptPattern = /<script[^>]*>(.*?)<\/script>/gs;
    const scripts = htmlContent.match(scriptPattern);
    if (scripts) {
        console.log('📜 Script 標籤數量:', scripts.length);
        
        scripts.forEach((script, index) => {
            if (script.includes('++') || script.includes('--')) {
                console.log(`🚨 Script ${index + 1} 包含 ++/--:`);
                console.log(script.substring(0, 200) + '...');
            }
        });
    }
    
    console.log('✅ HTML 源碼分析完成');
});