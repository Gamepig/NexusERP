#!/usr/bin/env python3
"""
NexusERP 導航系統 CSS 修復測試
測試修復後的導航欄排版、下拉選單和響應式設計
"""

import asyncio
import os
from playwright.async_api import async_playwright

async def test_navigation_fix():
    """測試導航系統修復後的功能"""
    
    async with async_playwright() as p:
        # 啟動瀏覽器
        browser = await p.chromium.launch(
            headless=False,
            args=['--start-maximized']
        )
        
        try:
            # 建立頁面
            page = await browser.new_page()
            await page.set_viewport_size({"width": 1920, "height": 1080})
            
            print("📋 開始測試 NexusERP 導航系統修復...")
            
            # 1. 訪問 dashboard 頁面
            print("\n1️⃣ 訪問 Dashboard 頁面...")
            await page.goto('http://127.0.0.1:8000/dashboard')
            await page.wait_for_load_state('networkidle')
            await asyncio.sleep(2)
            
            # 截圖修復後的完整頁面
            await page.screenshot(
                path='/Users/gamepig/projects/NexusERP/frontend/navigation_fix_full_page.png',
                full_page=True
            )
            print("✅ 已截圖完整頁面")
            
            # 2. 檢查導航欄元素
            print("\n2️⃣ 檢查導航欄排版...")
            
            # 檢查主導航欄
            nav_bar = await page.query_selector('nav.bg-white')
            if nav_bar:
                print("✅ 找到主導航欄")
                
                # 檢查導航高度
                nav_box = await nav_bar.bounding_box()
                print(f"📏 導航欄高度: {nav_box['height']}px")
                
                # 檢查 logo 和選單項目
                logo = await page.query_selector('.navbar-brand, img[alt*="logo"], .logo')
                if logo:
                    print("✅ Logo 元素存在")
                else:
                    print("⚠️ 未找到 Logo 元素")
                
                # 檢查選單項目
                menu_items = await page.query_selector_all('nav a, nav .nav-link')
                print(f"📱 找到 {len(menu_items)} 個導航項目")
                
            else:
                print("❌ 未找到主導航欄")
            
            # 截圖導航欄區域
            if nav_bar:
                await nav_bar.screenshot(
                    path='/Users/gamepig/projects/NexusERP/frontend/navigation_bar_fix.png'
                )
                print("✅ 已截圖導航欄區域")
            
            # 3. 測試下拉選單
            print("\n3️⃣ 測試下拉選單功能...")
            
            # 尋找可能的下拉選單觸發器
            dropdown_triggers = await page.query_selector_all(
                '.dropdown-toggle, [data-bs-toggle="dropdown"], .dropdown-trigger, .nav-item.dropdown > a'
            )
            
            if dropdown_triggers:
                print(f"🔽 找到 {len(dropdown_triggers)} 個下拉選單觸發器")
                
                for i, trigger in enumerate(dropdown_triggers):
                    try:
                        # 取得觸發器文字
                        trigger_text = await trigger.inner_text()
                        print(f"   📋 下拉選單 {i+1}: {trigger_text.strip()}")
                        
                        # 點擊觸發器
                        await trigger.click()
                        await asyncio.sleep(1)
                        
                        # 檢查下拉選單是否顯示
                        dropdown_menu = await page.query_selector('.dropdown-menu.show, .dropdown-menu:not(.d-none)')
                        if dropdown_menu:
                            print(f"   ✅ 下拉選單 {i+1} 正確顯示")
                            
                            # 截圖下拉選單
                            await dropdown_menu.screenshot(
                                path=f'/Users/gamepig/projects/NexusERP/frontend/dropdown_menu_{i+1}_fix.png'
                            )
                            
                            # 檢查下拉項目
                            dropdown_items = await dropdown_menu.query_selector_all('a, .dropdown-item')
                            print(f"   📋 下拉項目數量: {len(dropdown_items)}")
                            
                        else:
                            print(f"   ❌ 下拉選單 {i+1} 未顯示")
                        
                        # 點擊其他地方關閉下拉選單
                        await page.click('body')
                        await asyncio.sleep(0.5)
                        
                    except Exception as e:
                        print(f"   ⚠️ 測試下拉選單 {i+1} 時發生錯誤: {e}")
            else:
                print("⚠️ 未找到下拉選單觸發器")
            
            # 4. 檢查麵包屑導航
            print("\n4️⃣ 檢查麵包屑導航...")
            
            breadcrumb = await page.query_selector('.breadcrumb, nav[aria-label="breadcrumb"], .breadcrumb-container')
            if breadcrumb:
                print("✅ 找到麵包屑導航")
                
                # 檢查麵包屑樣式
                breadcrumb_box = await breadcrumb.bounding_box()
                print(f"📏 麵包屑高度: {breadcrumb_box['height']}px")
                
                # 截圖麵包屑
                await breadcrumb.screenshot(
                    path='/Users/gamepig/projects/NexusERP/frontend/breadcrumb_fix.png'
                )
                print("✅ 已截圖麵包屑導航")
                
                # 檢查麵包屑項目
                breadcrumb_items = await breadcrumb.query_selector_all('li, .breadcrumb-item, a')
                print(f"📋 麵包屑項目數量: {len(breadcrumb_items)}")
                
            else:
                print("⚠️ 未找到麵包屑導航")
            
            # 5. 測試響應式設計
            print("\n5️⃣ 測試響應式設計...")
            
            # 測試不同螢幕尺寸
            screen_sizes = [
                {"name": "桌面", "width": 1920, "height": 1080},
                {"name": "平板", "width": 1024, "height": 768},
                {"name": "手機", "width": 375, "height": 667}
            ]
            
            for size in screen_sizes:
                print(f"   📱 測試 {size['name']} 尺寸 ({size['width']}x{size['height']})...")
                
                await page.set_viewport_size({
                    "width": size['width'], 
                    "height": size['height']
                })
                await asyncio.sleep(1)
                
                # 截圖不同尺寸
                await page.screenshot(
                    path=f'/Users/gamepig/projects/NexusERP/frontend/responsive_{size["name"]}_fix.png',
                    full_page=False
                )
                
                # 檢查是否有手機選單按鈕（小螢幕）
                if size['width'] < 768:
                    mobile_toggle = await page.query_selector(
                        '.navbar-toggler, .mobile-menu-toggle, .hamburger-menu, [data-bs-toggle="collapse"]'
                    )
                    if mobile_toggle:
                        print(f"   ✅ {size['name']} 尺寸有手機選單按鈕")
                        
                        # 測試手機選單
                        await mobile_toggle.click()
                        await asyncio.sleep(1)
                        
                        mobile_menu = await page.query_selector('.navbar-collapse.show, .mobile-menu.show')
                        if mobile_menu:
                            print(f"   ✅ {size['name']} 手機選單正確顯示")
                        else:
                            print(f"   ❌ {size['name']} 手機選單未顯示")
                    else:
                        print(f"   ⚠️ {size['name']} 尺寸未找到手機選單按鈕")
            
            # 恢復桌面尺寸
            await page.set_viewport_size({"width": 1920, "height": 1080})
            await asyncio.sleep(1)
            
            # 6. CSS 檢查
            print("\n6️⃣ 檢查 CSS 載入和樣式...")
            
            # 檢查 Tailwind CSS 是否載入
            tailwind_classes = await page.evaluate("""
                () => {
                    const elements = document.querySelectorAll('[class*="bg-"], [class*="text-"], [class*="p-"], [class*="m-"]');
                    return elements.length;
                }
            """)
            print(f"🎨 找到 {tailwind_classes} 個使用 Tailwind CSS 的元素")
            
            # 檢查自定義 CSS
            custom_styles = await page.evaluate("""
                () => {
                    const stylesheets = Array.from(document.styleSheets);
                    return stylesheets.length;
                }
            """)
            print(f"📄 載入了 {custom_styles} 個 CSS 檔案")
            
            # 7. 效能檢查
            print("\n7️⃣ 檢查頁面效能...")
            
            # 重新載入頁面並測量載入時間
            start_time = asyncio.get_event_loop().time()
            await page.goto('http://127.0.0.1:8000/dashboard')
            await page.wait_for_load_state('networkidle')
            end_time = asyncio.get_event_loop().time()
            
            load_time = end_time - start_time
            print(f"⚡ 頁面載入時間: {load_time:.2f} 秒")
            
            # 8. 最終完整截圖
            print("\n8️⃣ 生成最終測試截圖...")
            await page.screenshot(
                path='/Users/gamepig/projects/NexusERP/frontend/navigation_final_test.png',
                full_page=True
            )
            print("✅ 已生成最終測試截圖")
            
            print("\n🎉 導航系統修復測試完成！")
            print("\n📷 生成的截圖檔案：")
            print("   - navigation_fix_full_page.png (完整頁面)")
            print("   - navigation_bar_fix.png (導航欄)")
            print("   - breadcrumb_fix.png (麵包屑)")
            print("   - dropdown_menu_*.png (下拉選單)")
            print("   - responsive_*.png (響應式設計)")
            print("   - navigation_final_test.png (最終測試)")
            
        except Exception as e:
            print(f"❌ 測試過程中發生錯誤: {e}")
            
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(test_navigation_fix())