#!/usr/bin/env python3

import asyncio
import json
from playwright.async_api import async_playwright

async def test_quote_creation():
    async with async_playwright() as p:
        # 啟動瀏覽器
        browser = await p.chromium.launch(headless=False, slow_mo=1000)
        context = await browser.new_context()
        
        # 設定監聽網路請求
        network_logs = []
        
        def handle_request(request):
            if '/api/' in request.url or 'quotes' in request.url:
                network_logs.append({
                    'type': 'REQUEST',
                    'method': request.method,
                    'url': request.url,
                    'headers': dict(request.headers),
                    'post_data': request.post_data if request.post_data else None
                })
        
        def handle_response(response):
            if '/api/' in response.url or 'quotes' in response.url:
                network_logs.append({
                    'type': 'RESPONSE',
                    'status': response.status,
                    'url': response.url,
                    'headers': dict(response.headers)
                })
        
        page = await context.new_page()
        page.on('request', handle_request)
        page.on('response', handle_response)
        
        try:
            print('📝 步驟1: 打開報價建立頁面')
            await page.goto('http://127.0.0.1:8000/quotes/multi-step-form')
            await page.wait_for_load_state('networkidle')
            print('✅ 頁面已加載')
            
            # 檢查頁面是否正常載入
            page_title = await page.title()
            print(f'📄 頁面標題: {page_title}')
            
            # 等待表單載入
            await page.wait_for_selector('#quote-form', timeout=10000)
            print('✅ 表單已找到')
            
            print('📝 步驟2: 填寫客戶資訊')
            # 選擇客戶
            await page.select_option('#customer_id', label='Vic Huang')
            print('✅ 已選擇客戶: Vic Huang')
            
            print('📝 步驟3: 填寫日期資訊')
            # 填寫報價日期
            await page.fill('#quote_date', '2025-08-07')
            print('✅ 已填寫報價日期: 2025-08-07')
            
            # 填寫有效期限
            await page.fill('#valid_until', '2025-09-06')
            print('✅ 已填寫有效期限: 2025-09-06')
            
            print('📝 步驟4: 選擇狀態和幣別')
            # 選擇狀態
            await page.select_option('#status', 'sent')
            print('✅ 已選擇狀態: sent')
            
            # 選擇幣別
            await page.select_option('#currency_id', '1')  # TWD
            print('✅ 已選擇幣別: TWD (ID: 1)')
            
            print('📝 步驟5: 新增產品項目')
            # 點擊新增產品按鈕
            await page.click('#add-item-btn')
            await page.wait_for_timeout(1000)
            print('✅ 已點擊新增產品按鈕')
            
            # 搜尋產品
            product_search = page.locator('.product-search').first
            await product_search.fill('筆記本')
            await page.wait_for_timeout(2000)
            
            # 選擇第一個搜尋結果
            search_results = page.locator('.search-results .product-item')
            if await search_results.count() > 0:
                await search_results.first.click()
                print('✅ 已選擇產品: 筆記本')
            else:
                print('⚠️ 沒有找到搜尋結果，使用備用方案')
                # 直接填寫產品資訊
                await page.fill('input[name="items[0][product_name]"]', '測試產品')
                await page.fill('input[name="items[0][description]"]', '測試產品描述')
            
            # 填寫數量和單價
            await page.fill('input[name="items[0][quantity]"]', '1')
            await page.fill('input[name="items[0][unit_price]"]', '1000')
            print('✅ 已填寫數量: 1, 單價: 1000')
            
            print('📝 步驟6: 提交表單')
            # 提交表單前先等待一下
            await page.wait_for_timeout(1000)
            
            # 提交表單
            await page.click('button[type="submit"]')
            print('✅ 已點擊提交按鈕')
            
            # 等待頁面跳轉或回應
            try:
                await page.wait_for_load_state('networkidle', timeout=15000)
                current_url = page.url
                print(f'✅ 表單提交完成，當前URL: {current_url}')
            except Exception as e:
                print(f'⚠️ 等待頁面載入超時: {e}')
                current_url = page.url
                print(f'當前URL: {current_url}')
            
            # 檢查是否有錯誤訊息
            error_elements = await page.locator('.alert-danger, .error, .invalid-feedback').count()
            if error_elements > 0:
                errors = []
                for i in range(error_elements):
                    error_text = await page.locator('.alert-danger, .error, .invalid-feedback').nth(i).text_content()
                    errors.append(error_text)
                print(f'❌ 發現錯誤訊息: {errors}')
            else:
                print('✅ 沒有發現錯誤訊息')
            
            # 檢查是否有成功訊息
            success_elements = await page.locator('.alert-success, .success').count()
            if success_elements > 0:
                success_messages = []
                for i in range(success_elements):
                    success_text = await page.locator('.alert-success, .success').nth(i).text_content()
                    success_messages.append(success_text)
                print(f'✅ 成功訊息: {success_messages}')
            
            # 輸出網路請求記錄
            print('\n📡 網路請求記錄:')
            for i, log in enumerate(network_logs):
                print(f'  {i+1}. {log}')
            
            # 等待一段時間讓用戶觀察結果
            await page.wait_for_timeout(3000)
            
        except Exception as e:
            print(f'❌ 測試過程中發生錯誤: {e}')
            
            # 取得當前頁面截圖
            await page.screenshot(path='/Users/gamepig/projects/NexusERP/frontend/error_screenshot.png')
            print('📸 已儲存錯誤截圖: error_screenshot.png')
            
            # 取得頁面內容以便除錯
            page_content = await page.content()
            with open('/Users/gamepig/projects/NexusERP/frontend/error_page_content.html', 'w', encoding='utf-8') as f:
                f.write(page_content)
            print('📄 已儲存頁面內容: error_page_content.html')
        
        finally:
            await browser.close()
            print('✅ 瀏覽器已關閉')

# 執行測試
if __name__ == "__main__":
    asyncio.run(test_quote_creation())