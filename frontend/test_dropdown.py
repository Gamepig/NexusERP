
from playwright.sync_api import sync_playwright
import time

def test_user_dropdown():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False, slow_mo=1000)
        page = browser.new_page()
        
        try:
            # 1. 導航到主頁
            print("1. 導航到 http://127.0.0.1:8000")
            page.goto("http://127.0.0.1:8000")
            
            # 2. 強制刷新頁面
            print("2. 強制刷新頁面")
            page.reload(wait_until="networkidle")
            time.sleep(2)
            
            # 3. 尋找並點擊用戶下拉選單
            print("3. 點擊用戶下拉選單")
            user_dropdown = page.locator("[data-dropdown-toggle='user-dropdown']")
            if user_dropdown.count() > 0:
                user_dropdown.click()
                time.sleep(1)
                
                # 4. 截圖用戶下拉選單
                print("4. 截圖用戶下拉選單狀態")
                page.screenshot(path="user_dropdown_test.png", full_page=True)
                
                # 5. 檢查下拉選單的樣式
                dropdown_menu = page.locator("#user-dropdown")
                if dropdown_menu.count() > 0:
                    # 獲取計算樣式
                    bg_color = page.evaluate("""
                        () => {
                            const element = document.getElementById('user-dropdown');
                            if (element) {
                                const styles = window.getComputedStyle(element);
                                return {
                                    backgroundColor: styles.backgroundColor,
                                    borderColor: styles.borderColor,
                                    borderWidth: styles.borderWidth,
                                    borderStyle: styles.borderStyle
                                };
                            }
                            return null;
                        }
                    """)
                    
                    print(f"下拉選單樣式: {bg_color}")
                    
                    # 驗證是否為白色背景
                    if bg_color and bg_color.get('backgroundColor'):
                        if 'rgb(255, 255, 255)' in bg_color['backgroundColor'] or 'white' in bg_color['backgroundColor']:
                            print("✅ 背景顏色已成功變更為白色")
                        else:
                            print(f"❌ 背景顏色未變更: {bg_color['backgroundColor']}")
                    
                    return True
                else:
                    print("❌ 找不到下拉選單元素")
                    return False
            else:
                print("❌ 找不到用戶下拉觸發按鈕")
                return False
                
        except Exception as e:
            print(f"測試過程中發生錯誤: {e}")
            return False
        finally:
            browser.close()

if __name__ == "__main__":
    test_user_dropdown()
