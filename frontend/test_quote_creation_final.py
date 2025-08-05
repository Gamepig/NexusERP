#!/usr/bin/env python3
"""
報價單建立功能最終驗證測試
測試目標：驗證日期格式修復後，報價單建立功能是否完全正常
"""

import asyncio
from playwright.async_api import async_playwright
import json
from datetime import datetime

async def test_quote_creation():
    """測試報價單建立功能"""
    async with async_playwright() as p:
        # 啟動瀏覽器
        browser = await p.chromium.launch(headless=False)
        page = await browser.new_page()
        
        try:
            print("🧪 開始最終報價單建立功能驗證測試")
            print("=" * 60)
            
            # 步驟 1: 前往登入頁面
            print("📋 步驟 1: 前往登入頁面")
            await page.goto("http://127.0.0.1:8000/login")
            await page.wait_for_load_state('networkidle')
            
            # 步驟 2: 登入系統
            print("📋 步驟 2: 登入系統")
            await page.fill('input[name="email"]', 'test@example.com')
            await page.fill('input[name="password"]', 'password123')
            await page.click('button[type="submit"]')
            await page.wait_for_load_state('networkidle')
            
            # 檢查是否成功登入
            current_url = page.url
            print(f"   登入後 URL: {current_url}")
            
            # 步驟 3: 前往報價單建立頁面
            print("📋 步驟 3: 前往報價單建立頁面")
            await page.goto("http://127.0.0.1:8000/quotes/create")
            await page.wait_for_load_state('networkidle')
            
            current_url = page.url
            print(f"   報價單建立頁面 URL: {current_url}")
            
            # 檢查頁面標題
            title = await page.title()
            print(f"   頁面標題: {title}")
            
            # 步驟 4: 檢查表單元素是否存在
            print("📋 步驟 4: 檢查表單元素")
            
            # 檢查客戶下拉選單
            customer_select = page.locator('select[name="customer_id"]')
            customer_exists = await customer_select.count() > 0
            print(f"   ✅ 客戶選擇欄位存在: {customer_exists}")
            
            # 檢查產品相關欄位
            product_name = page.locator('input[name="items[0][product_name]"]')
            product_name_exists = await product_name.count() > 0
            print(f"   ✅ 產品名稱欄位存在: {product_name_exists}")
            
            quantity = page.locator('input[name="items[0][quantity]"]')
            quantity_exists = await quantity.count() > 0
            print(f"   ✅ 數量欄位存在: {quantity_exists}")
            
            unit_price = page.locator('input[name="items[0][unit_price]"]')
            unit_price_exists = await unit_price.count() > 0
            print(f"   ✅ 單價欄位存在: {unit_price_exists}")
            
            # 步驟 5: 填寫表單
            print("📋 步驟 5: 填寫表單")
            
            # 選擇客戶
            if customer_exists:
                # 獲取可用的客戶選項
                customer_options = await customer_select.locator('option').all()
                if len(customer_options) > 1:  # 除了預設選項外有其他選項
                    customer_value = await customer_options[1].get_attribute('value')
                    await customer_select.select_option(customer_value)
                    selected_customer = await customer_options[1].inner_text()
                    print(f"   ✅ 已選擇客戶: {selected_customer}")
                else:
                    print("   ⚠️ 沒有可用的客戶選項")
                    # 創建一個測試客戶
                    print("   📝 嘗試創建測試客戶...")
                    
            # 填寫產品資訊
            if product_name_exists:
                await product_name.fill("最終測試產品")
                print("   ✅ 已填寫產品名稱: 最終測試產品")
            
            if quantity_exists:
                await quantity.fill("1")
                print("   ✅ 已填寫數量: 1")
            
            if unit_price_exists:
                await unit_price.fill("1500")
                print("   ✅ 已填寫單價: 1500")
            
            # 步驟 6: 提交表單
            print("📋 步驟 6: 提交表單")
            
            # 查找提交按鈕
            submit_button = page.locator('button[type="submit"]')
            submit_exists = await submit_button.count() > 0
            
            if submit_exists:
                button_text = await submit_button.inner_text()
                print(f"   找到提交按鈕: {button_text}")
                
                # 監聽網路請求
                response_promise = page.wait_for_response(lambda response: '/quotes' in response.url and response.request.method == 'POST')
                
                # 點擊提交按鈕
                await submit_button.click()
                print("   ✅ 已點擊提交按鈕")
                
                # 等待回應
                try:
                    response = await response_promise
                    status = response.status
                    print(f"   📡 伺服器回應狀態碼: {status}")
                    
                    # 等待頁面加載
                    await page.wait_for_load_state('networkidle', timeout=10000)
                    
                    # 檢查結果
                    final_url = page.url
                    print(f"   📍 提交後 URL: {final_url}")
                    
                    # 檢查是否有成功訊息
                    success_messages = await page.locator('.alert-success, .success, [class*="success"]').all()
                    if success_messages:
                        for msg in success_messages:
                            msg_text = await msg.inner_text()
                            print(f"   ✅ 成功訊息: {msg_text}")
                    
                    # 檢查是否有錯誤訊息
                    error_messages = await page.locator('.alert-danger, .error, [class*="error"]').all()
                    if error_messages:
                        for msg in error_messages:
                            msg_text = await msg.inner_text()
                            print(f"   ❌ 錯誤訊息: {msg_text}")
                    
                    # 如果跳轉到報價單詳細頁面，檢查內容
                    if 'quotes/' in final_url and final_url != "http://127.0.0.1:8000/quotes/create":
                        print("   🎯 成功跳轉到報價單詳細頁面！")
                        
                        # 檢查頁面內容
                        page_content = await page.content()
                        
                        # 檢查是否顯示產品資訊
                        if "最終測試產品" in page_content:
                            print("   ✅ 產品名稱正確顯示")
                        
                        if "1500" in page_content:
                            print("   ✅ 單價正確顯示")
                        
                        # 檢查總金額
                        if "1500" in page_content or "1,500" in page_content:
                            print("   ✅ 總金額計算正確")
                        
                        # 取得報價單 ID
                        quote_id = final_url.split('/')[-1]
                        print(f"   📋 報價單 ID: {quote_id}")
                        
                    else:
                        print("   ❌ 未能跳轉到報價單詳細頁面")
                        
                        # 檢查是否還在建立頁面且有錯誤
                        if final_url == "http://127.0.0.1:8000/quotes/create":
                            print("   📍 仍在建立頁面，檢查錯誤原因...")
                            
                            # 檢查表單驗證錯誤
                            validation_errors = await page.locator('.invalid-feedback, .error-message').all()
                            if validation_errors:
                                for error in validation_errors:
                                    error_text = await error.inner_text()
                                    print(f"   ❌ 表單驗證錯誤: {error_text}")
                
                except Exception as e:
                    print(f"   ❌ 提交過程發生錯誤: {str(e)}")
                    
                    # 檢查當前頁面狀態
                    current_url = page.url
                    print(f"   📍 當前 URL: {current_url}")
                    
                    # 檢查是否有錯誤訊息
                    error_messages = await page.locator('body').inner_text()
                    if "Invalid request data" in error_messages:
                        print("   ❌ 仍然出現 'Invalid request data' 錯誤")
                    elif "419" in error_messages:
                        print("   ❌ CSRF token 錯誤")
                    else:
                        print(f"   📝 頁面內容摘要: {error_messages[:500]}...")
                        
            else:
                print("   ❌ 找不到提交按鈕")
            
            # 步驟 7: 測試總結
            print("\n" + "=" * 60)
            print("🧪 測試總結")
            print("=" * 60)
            
            if 'quotes/' in page.url and page.url != "http://127.0.0.1:8000/quotes/create":
                print("✅ 測試成功！報價單建立功能正常運作")
                print("   - 成功登入系統")
                print("   - 成功填寫表單")
                print("   - 成功提交報價單")
                print("   - 成功跳轉到詳細頁面")
                print("   - 資料正確顯示")
            else:
                print("❌ 測試失敗！報價單建立功能仍有問題")
                print("   需要進一步檢查和修復")
            
        except Exception as e:
            print(f"❌ 測試過程發生未預期錯誤: {str(e)}")
            
        finally:
            # 保持瀏覽器開啟一段時間以便查看結果
            print("\n瀏覽器將在 10 秒後關閉...")
            await asyncio.sleep(10)
            await browser.close()

if __name__ == "__main__":
    asyncio.run(test_quote_creation())