import { test, expect } from '@playwright/test';

test('檢查登入頁面結構', async ({ page }) => {
  await page.goto('http://127.0.0.1:8000');
  await page.screenshot({ path: 'screenshots/debug-登入頁面結構.png' });
  
  // 檢查頁面內容
  const pageContent = await page.content();
  console.log('頁面標題:', await page.title());
  
  // 檢查登入表單元素
  const emailInputs = await page.locator('input[type="email"], input[name="email"], input[id*="email"]').count();
  const passwordInputs = await page.locator('input[type="password"], input[name="password"], input[id*="password"]').count();
  const submitButtons = await page.locator('button[type="submit"], input[type="submit"]').count();
  
  console.log('Email 輸入框數量:', emailInputs);
  console.log('Password 輸入框數量:', passwordInputs);
  console.log('提交按鈕數量:', submitButtons);
  
  // 列出所有表單元素
  const allInputs = await page.locator('input').all();
  console.log('所有輸入框:');
  for (let i = 0; i < allInputs.length; i++) {
    const input = allInputs[i];
    const type = await input.getAttribute('type');
    const name = await input.getAttribute('name');
    const id = await input.getAttribute('id');
    const placeholder = await input.getAttribute('placeholder');
    console.log(`  輸入框 ${i + 1}: type="${type}", name="${name}", id="${id}", placeholder="${placeholder}"`);
  }
  
  const allButtons = await page.locator('button').all();
  console.log('所有按鈕:');
  for (let i = 0; i < allButtons.length; i++) {
    const button = allButtons[i];
    const type = await button.getAttribute('type');
    const text = await button.textContent();
    console.log(`  按鈕 ${i + 1}: type="${type}", text="${text}"`);
  }
});