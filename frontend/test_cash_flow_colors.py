#!/usr/bin/env python3
"""
現金流量表頁面顏色驗證測試
測試修正後的表格標題行和總計行背景顏色
"""

import asyncio
from playwright.async_api import async_playwright
import os
from datetime import datetime

async def test_cash_flow_colors():
    async with async_playwright() as p:
        # 啟動瀏覽器
        browser = await p.chromium.launch(headless=False, slow_mo=1000)
        context = await browser.new_context(viewport={'width': 1400, 'height': 900})
        page = await context.new_page()
        
        try:
            print("🚀 開始測試現金流量表頁面顏色修正...")
            
            # 1. 訪問登入頁面
            print("📍 Step 1: 訪問登入頁面")
            await page.goto('http://127.0.0.1:8000/login')
            await page.wait_for_load_state('networkidle')
            
            # 截圖登入頁面
            await page.screenshot(path='login_page.png')
            print("📸 登入頁面截圖已保存")
            
            # 2. 登入系統
            print("🔐 Step 2: 使用測試帳號登入")
            await page.fill('input[name="email"]', 'test@example.com')
            await page.fill('input[name="password"]', 'password123')
            await page.click('button[type="submit"]')
            
            # 等待登入完成
            await page.wait_for_load_state('networkidle')
            await asyncio.sleep(2)
            
            # 3. 直接訪問現金流量表頁面
            print("📊 Step 3: 訪問現金流量表頁面")
            await page.goto('http://127.0.0.1:8000/reports/financial/cash-flow')
            await page.wait_for_load_state('networkidle')
            await asyncio.sleep(3)
            
            # 截圖整個頁面
            await page.screenshot(path='cash_flow_page_full.png', full_page=True)
            print("📸 現金流量表完整頁面截圖已保存")
            
            # 4. 檢查表格是否存在
            print("🔍 Step 4: 檢查表格結構")
            table_count = await page.locator('table').count()
            print(f"📋 找到 {table_count} 個表格")
            
            if table_count > 0:
                # 獲取第一個表格的所有行
                first_table = page.locator('table').first
                rows = await first_table.locator('tr').count()
                print(f"📋 第一個表格共有 {rows} 行")
                
                # 檢查每一行的樣式
                for i in range(rows):
                    try:
                        row = first_table.locator(f'tr:nth-child({i+1})')
                        row_text = await row.inner_text()
                        
                        # 檢查背景顏色樣式
                        if '營業活動現金流量' in row_text:
                            bg_color = await row.evaluate('el => getComputedStyle(el).backgroundColor')
                            class_attr = await row.get_attribute('class')
                            print(f"🟢 營業活動現金流量行 - 背景色: {bg_color}, Class: {class_attr}")
                            
                        elif '投資活動現金流量' in row_text:
                            bg_color = await row.evaluate('el => getComputedStyle(el).backgroundColor')
                            class_attr = await row.get_attribute('class')
                            print(f"🟠 投資活動現金流量行 - 背景色: {bg_color}, Class: {class_attr}")
                            
                        elif '籌資活動現金流量' in row_text:
                            bg_color = await row.evaluate('el => getComputedStyle(el).backgroundColor')
                            class_attr = await row.get_attribute('class')
                            print(f"🔵 籌資活動現金流量行 - 背景色: {bg_color}, Class: {class_attr}")
                            
                        elif '營業活動現金流入淨額' in row_text:
                            bg_color = await row.evaluate('el => getComputedStyle(el).backgroundColor')
                            class_attr = await row.get_attribute('class')
                            print(f"💚 營業活動現金流入淨額行 - 背景色: {bg_color}, Class: {class_attr}")
                            
                        elif '投資活動現金流出淨額' in row_text:
                            bg_color = await row.evaluate('el => getComputedStyle(el).backgroundColor')
                            class_attr = await row.get_attribute('class')
                            print(f"🧡 投資活動現金流出淨額行 - 背景色: {bg_color}, Class: {class_attr}")
                            
                        elif '籌資活動現金流出淨額' in row_text:
                            bg_color = await row.evaluate('el => getComputedStyle(el).backgroundColor')
                            class_attr = await row.get_attribute('class')
                            print(f"💙 籌資活動現金流出淨額行 - 背景色: {bg_color}, Class: {class_attr}")
                    except Exception as row_error:
                        print(f"⚠️ 檢查第 {i+1} 行時發生錯誤: {str(row_error)}")
            else:
                print("❌ 未找到表格")
            
            # 5. 特別關注紅色框框區域 - 尋找帶有背景色的行
            print("🎯 Step 5: 檢查帶有背景色的表格行")
            
            # 尋找所有帶有 bg- 開頭class的元素
            colored_elements = await page.locator('[class*="bg-"]').count()
            print(f"🎨 找到 {colored_elements} 個帶有背景色的元素")
            
            if colored_elements > 0:
                for i in range(min(colored_elements, 10)):  # 限制檢查前10個
                    element = page.locator('[class*="bg-"]').nth(i)
                    element_class = await element.get_attribute('class')
                    element_text = await element.inner_text()
                    bg_color = await element.evaluate('el => getComputedStyle(el).backgroundColor')
                    print(f"🎨 元素 {i+1}: class='{element_class}', 背景色='{bg_color}', 文字='{element_text[:50]}...'")
            
            # 6. 檢查特定的樣式類別
            print("🔍 Step 6: 檢查特定背景色類別")
            bg_classes = [
                'bg-green-100', 'bg-green-200', 'bg-green-300',
                'bg-orange-100', 'bg-orange-200', 'bg-orange-300', 
                'bg-blue-100', 'bg-blue-200', 'bg-blue-300'
            ]
            
            for bg_class in bg_classes:
                elements = await page.locator(f'.{bg_class}').count()
                if elements > 0:
                    print(f"✅ 找到 {elements} 個使用 {bg_class} 的元素")
                    
                    # 獲取第一個元素的詳細資訊
                    first_element = page.locator(f'.{bg_class}').first
                    text = await first_element.inner_text()
                    computed_bg = await first_element.evaluate('el => getComputedStyle(el).backgroundColor')
                    print(f"   文字內容: {text[:50]}...")
                    print(f"   計算後背景色: {computed_bg}")
            
            # 7. 最終截圖
            print("📸 Step 7: 保存最終測試截圖")
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            await page.screenshot(path=f'cash_flow_colors_test_{timestamp}.png', full_page=True)
            print(f"📸 測試截圖已保存: cash_flow_colors_test_{timestamp}.png")
            
            # 8. 檢查頁面HTML內容
            print("📄 Step 8: 檢查頁面HTML內容")
            page_content = await page.content()
            
            # 尋找顏色相關的關鍵字
            color_keywords = ['bg-green', 'bg-orange', 'bg-blue', 'background-color']
            for keyword in color_keywords:
                if keyword in page_content:
                    print(f"✅ 頁面包含 '{keyword}' 樣式")
                else:
                    print(f"❌ 頁面未包含 '{keyword}' 樣式")
            
            print("✅ 現金流量表頁面顏色測試完成！")
            
        except Exception as e:
            print(f"❌ 測試過程中發生錯誤: {str(e)}")
            await page.screenshot(path='error_screenshot.png')
            
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(test_cash_flow_colors())