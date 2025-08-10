#!/usr/bin/env python3
"""
現金流量表顏色修正最終驗證腳本
驗證所有區域的背景顏色是否正確顯示
"""

from playwright.sync_api import sync_playwright
import time
import os

def verify_cash_flow_colors():
    """驗證現金流量表的所有背景顏色是否正確"""
    
    with sync_playwright() as p:
        # 啟動瀏覽器
        browser = p.chromium.launch(headless=False, slow_mo=1000)
        context = browser.new_context(
            viewport={'width': 1920, 'height': 1080}
        )
        page = context.new_page()
        
        try:
            print("🔍 開始現金流量表顏色修正驗證...")
            
            # 1. 訪問登入頁面
            print("1. 訪問登入頁面...")
            page.goto("http://127.0.0.1:8000/login")
            page.wait_for_load_state("networkidle")
            
            # 2. 使用測試帳號登入
            print("2. 使用測試帳號登入...")
            page.fill('input[name="email"]', 'test@example.com')
            page.fill('input[name="password"]', 'password123')
            page.click('button[type="submit"]')
            page.wait_for_load_state("networkidle")
            
            # 3. 訪問現金流量表頁面
            print("3. 訪問現金流量表頁面...")
            page.goto("http://127.0.0.1:8000/reports/financial/cash-flow")
            page.wait_for_load_state("networkidle")
            time.sleep(3)  # 等待頁面完全載入
            
            # 4. 檢查頁面標題
            print("4. 檢查頁面是否正確載入...")
            title = page.title()
            print(f"   頁面標題: {title}")
            
            # 5. 截圖記錄最終效果
            print("5. 截圖記錄最終修正效果...")
            screenshot_path = "/Users/gamepig/projects/NexusERP/frontend/tests/screenshots/cash_flow_final_verification.png"
            os.makedirs(os.path.dirname(screenshot_path), exist_ok=True)
            page.screenshot(path=screenshot_path, full_page=True)
            print(f"   完整頁面截圖已保存至: {screenshot_path}")
            
            # 6. 檢查表格主要區域的背景顏色
            print("6. 檢查表格主要區域的背景顏色...")
            
            # 檢查營業活動標題行
            operating_title = page.locator('tr.operating-section')
            if operating_title.count() > 0:
                style = operating_title.first.get_attribute('style') or ''
                class_attr = operating_title.first.get_attribute('class') or ''
                print(f"   營業活動標題行 - style: {style}, class: {class_attr}")
            
            # 檢查投資活動標題行
            investing_title = page.locator('tr.investing-section')
            if investing_title.count() > 0:
                style = investing_title.first.get_attribute('style') or ''
                class_attr = investing_title.first.get_attribute('class') or ''
                print(f"   投資活動標題行 - style: {style}, class: {class_attr}")
            
            # 檢查籌資活動標題行
            financing_title = page.locator('tr.financing-section')
            if financing_title.count() > 0:
                style = financing_title.first.get_attribute('style') or ''
                class_attr = financing_title.first.get_attribute('class') or ''
                print(f"   籌資活動標題行 - style: {style}, class: {class_attr}")
            
            # 檢查總計行
            subtotal_rows = page.locator('tr.subtotal')
            print(f"   找到 {subtotal_rows.count()} 個總計行")
            for i in range(subtotal_rows.count()):
                row = subtotal_rows.nth(i)
                style = row.get_attribute('style') or ''
                class_attr = row.get_attribute('class') or ''
                text = row.inner_text()[:50] + "..." if len(row.inner_text()) > 50 else row.inner_text()
                print(f"   總計行 {i+1} - {text} - style: {style}, class: {class_attr}")
            
            # 檢查最終總計行
            final_rows = page.locator('tr.final-total')
            print(f"   找到 {final_rows.count()} 個最終總計行")
            for i in range(final_rows.count()):
                row = final_rows.nth(i)
                style = row.get_attribute('style') or ''
                class_attr = row.get_attribute('class') or ''
                text = row.inner_text()[:50] + "..." if len(row.inner_text()) > 50 else row.inner_text()
                print(f"   最終總計行 {i+1} - {text} - style: {style}, class: {class_attr}")
            
            # 7. 檢查右側圖表區域
            print("7. 檢查右側圖表區域...")
            chart_sections = page.locator('.chart-section, .summary-item')
            print(f"   找到 {chart_sections.count()} 個圖表區段")
            
            # 8. 檢查所有帶有背景顏色的元素
            print("8. 檢查所有表格行的背景顏色...")
            all_rows = page.locator('table tr')
            colored_rows_count = 0
            
            for i in range(all_rows.count()):
                row = all_rows.nth(i)
                style = row.get_attribute('style') or ''
                class_list = row.get_attribute('class') or ''
                
                # 檢查是否有背景顏色相關屬性
                has_bg_color = (
                    'background' in style.lower() or 
                    'bg-' in class_list or
                    any(cls in class_list for cls in ['operating-section', 'investing-section', 'financing-section', 'subtotal', 'final-total'])
                )
                
                if has_bg_color:
                    colored_rows_count += 1
                    text = row.inner_text()[:80].replace('\n', ' ') + "..." if len(row.inner_text()) > 80 else row.inner_text().replace('\n', ' ')
                    print(f"   有色彩行 {colored_rows_count}: {text}")
                    print(f"     class: {class_list}")
                    print(f"     style: {style}")
                    print()
            
            print(f"✅ 檢查完成！共找到 {colored_rows_count} 個有背景顏色的表格行")
            
            # 9. 等待使用者查看
            print("9. 請檢查瀏覽器視窗中的現金流量表顏色效果...")
            print("   按 Enter 鍵完成驗證...")
            input()
            
        except Exception as e:
            print(f"❌ 驗證過程發生錯誤: {str(e)}")
        
        finally:
            browser.close()

if __name__ == "__main__":
    verify_cash_flow_colors()