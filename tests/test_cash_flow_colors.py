#!/usr/bin/env python3
"""
現金流量表頁面顏色主題測試腳本
測試淺色/深色模式切換和各種顏色主題的顯示效果
"""

import asyncio
import os
from datetime import datetime
from playwright.async_api import async_playwright, Page

class CashFlowColorsTester:
    def __init__(self):
        self.base_url = "http://127.0.0.1:8000"
        self.test_url = f"{self.base_url}/test-cash-flow-colors"
        self.screenshot_dir = "/Users/gamepig/projects/NexusERP/screenshots"
        self.timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        self.test_results = []
        
    async def setup_directories(self):
        """建立截圖目錄"""
        if not os.path.exists(self.screenshot_dir):
            os.makedirs(self.screenshot_dir)
            print(f"✅ 建立截圖目錄: {self.screenshot_dir}")
    
    async def wait_for_page_load(self, page: Page):
        """等待頁面完全載入"""
        try:
            # 等待網路請求完成
            await page.wait_for_load_state('networkidle', timeout=15000)
            
            # 嘗試等待多種可能的選擇器
            possible_selectors = [
                '.cash-flow-container',
                '.container',
                'main',
                'body',
                '[data-testid="cash-flow"]',
                '.content',
                '#app'
            ]
            
            content_found = False
            for selector in possible_selectors:
                try:
                    await page.wait_for_selector(selector, timeout=3000)
                    print(f"✅ 找到頁面元素: {selector}")
                    content_found = True
                    break
                except:
                    continue
            
            if not content_found:
                print("⚠️ 未找到特定選擇器，但頁面可能已載入")
            
            # 額外等待確保所有動畫和樣式都載入完成
            await page.wait_for_timeout(3000)
            
            return True
        except Exception as e:
            print(f"❌ 頁面載入失敗: {str(e)}")
            # 即使載入失敗，也嘗試繼續測試
            return True
    
    async def take_screenshot(self, page: Page, filename: str, description: str):
        """截取頁面截圖"""
        try:
            screenshot_path = os.path.join(self.screenshot_dir, f"{self.timestamp}_{filename}")
            await page.screenshot(path=screenshot_path, full_page=True)
            print(f"📸 截圖已保存: {screenshot_path}")
            self.test_results.append({
                'action': '截圖',
                'description': description,
                'filename': screenshot_path,
                'status': '成功'
            })
            return screenshot_path
        except Exception as e:
            print(f"❌ 截圖失敗: {str(e)}")
            self.test_results.append({
                'action': '截圖',
                'description': description,
                'status': f'失敗: {str(e)}'
            })
            return None
    
    async def check_theme_colors(self, page: Page, mode: str):
        """檢查主題顏色是否正確應用"""
        print(f"\n🎨 檢查 {mode} 模式下的顏色主題...")
        
        color_checks = []
        
        try:
            # 檢查營業活動現金流（綠色主題）
            operating_elements = await page.query_selector_all('.operating-section, .text-green-600, .bg-green-50')
            if operating_elements:
                color_checks.append(('營業活動現金流', '綠色主題', len(operating_elements), '✅'))
            else:
                color_checks.append(('營業活動現金流', '綠色主題', 0, '❌'))
            
            # 檢查投資活動現金流（橘色主題）
            investing_elements = await page.query_selector_all('.investing-section, .text-orange-600, .bg-orange-50')
            if investing_elements:
                color_checks.append(('投資活動現金流', '橘色主題', len(investing_elements), '✅'))
            else:
                color_checks.append(('投資活動現金流', '橘色主題', 0, '❌'))
            
            # 檢查籌資活動現金流（藍色主題）
            financing_elements = await page.query_selector_all('.financing-section, .text-blue-600, .bg-blue-50')
            if financing_elements:
                color_checks.append(('籌資活動現金流', '藍色主題', len(financing_elements), '✅'))
            else:
                color_checks.append(('籌資活動現金流', '藍色主題', 0, '❌'))
            
            # 如果是深色模式，檢查深色主題元素
            if mode == '深色':
                dark_elements = await page.query_selector_all('.dark\\:bg-gray-800, .dark\\:text-white, .dark\\:border-gray-600')
                if dark_elements:
                    color_checks.append(('深色模式主題', '深色樣式', len(dark_elements), '✅'))
                else:
                    color_checks.append(('深色模式主題', '深色樣式', 0, '❌'))
            
        except Exception as e:
            print(f"❌ 顏色檢查錯誤: {str(e)}")
            color_checks.append(('顏色檢查', '系統錯誤', 0, f'❌ {str(e)}'))
        
        # 記錄檢查結果
        for category, theme, count, status in color_checks:
            print(f"  {status} {category}: {theme} (找到 {count} 個元素)")
            self.test_results.append({
                'action': '顏色檢查',
                'description': f'{mode}模式 - {category}',
                'theme': theme,
                'elements_found': count,
                'status': '通過' if status == '✅' else '失敗'
            })
        
        return color_checks
    
    async def check_data_display(self, page: Page):
        """檢查數據顯示是否正確"""
        print("\n📊 檢查數據顯示...")
        
        data_checks = []
        
        try:
            # 檢查現金流數據是否存在
            cash_flow_values = await page.query_selector_all('.cash-flow-amount, .amount, [data-amount]')
            if cash_flow_values:
                data_checks.append(('現金流數值', len(cash_flow_values), '✅'))
            else:
                data_checks.append(('現金流數值', 0, '❌'))
            
            # 檢查圖表是否載入
            charts = await page.query_selector_all('canvas, .chart-container, .recharts-wrapper')
            if charts:
                data_checks.append(('圖表元素', len(charts), '✅'))
            else:
                data_checks.append(('圖表元素', 0, '❌'))
            
            # 檢查表格資料
            table_rows = await page.query_selector_all('tr, .table-row, .data-row')
            if table_rows and len(table_rows) > 1:  # 除了標題行
                data_checks.append(('表格資料', len(table_rows), '✅'))
            else:
                data_checks.append(('表格資料', len(table_rows) if table_rows else 0, '❌'))
            
        except Exception as e:
            print(f"❌ 數據檢查錯誤: {str(e)}")
            data_checks.append(('數據檢查', 0, f'❌ {str(e)}'))
        
        # 記錄檢查結果
        for category, count, status in data_checks:
            print(f"  {status} {category}: 找到 {count} 個元素")
            self.test_results.append({
                'action': '數據檢查',
                'description': category,
                'elements_found': count,
                'status': '通過' if status == '✅' else '失敗'
            })
        
        return data_checks
    
    async def toggle_dark_mode(self, page: Page):
        """切換深色模式"""
        print("\n🌙 切換到深色模式...")
        
        try:
            # 常見的深色模式切換按鈕選擇器
            dark_mode_selectors = [
                '[data-toggle="dark-mode"]',
                '.dark-mode-toggle',
                '.theme-toggle',
                '.mode-switch',
                'button[aria-label*="dark"]',
                'button[title*="dark"]',
                '.toggle-dark',
                '.btn-dark-mode'
            ]
            
            dark_mode_button = None
            for selector in dark_mode_selectors:
                try:
                    dark_mode_button = await page.query_selector(selector)
                    if dark_mode_button:
                        print(f"  ✅ 找到深色模式按鈕: {selector}")
                        break
                except:
                    continue
            
            if not dark_mode_button:
                # 嘗試通過文字內容找到按鈕
                all_buttons = await page.query_selector_all('button')
                for button in all_buttons:
                    try:
                        text_content = await button.text_content()
                        if text_content and any(keyword in text_content.lower() for keyword in ['dark', '深色', '暗色', '夜間']):
                            dark_mode_button = button
                            print(f"  ✅ 通過文字找到深色模式按鈕: {text_content}")
                            break
                    except:
                        continue
            
            if dark_mode_button:
                await dark_mode_button.click()
                await page.wait_for_timeout(1000)  # 等待主題切換動畫
                
                self.test_results.append({
                    'action': '深色模式切換',
                    'description': '成功點擊深色模式按鈕',
                    'status': '成功'
                })
                return True
            else:
                print("  ❌ 未找到深色模式切換按鈕")
                self.test_results.append({
                    'action': '深色模式切換',
                    'description': '未找到深色模式按鈕',
                    'status': '失敗'
                })
                return False
                
        except Exception as e:
            print(f"  ❌ 深色模式切換失敗: {str(e)}")
            self.test_results.append({
                'action': '深色模式切換',
                'description': f'切換失敗: {str(e)}',
                'status': '失敗'
            })
            return False
    
    async def run_test(self):
        """執行完整測試"""
        print("🚀 開始現金流量表頁面顏色主題測試")
        print(f"📍 測試網址: {self.test_url}")
        
        await self.setup_directories()
        
        async with async_playwright() as p:
            # 啟動瀏覽器
            browser = await p.chromium.launch(headless=False, args=['--no-sandbox'])
            context = await browser.new_context(
                viewport={'width': 1920, 'height': 1080}
            )
            page = await context.new_page()
            
            try:
                print(f"\n📂 訪問頁面: {self.test_url}")
                response = await page.goto(self.test_url)
                print(f"📡 HTTP 狀態: {response.status}")
                
                # 檢查頁面標題
                title = await page.title()
                print(f"📄 頁面標題: {title}")
                
                # 檢查頁面內容
                page_content = await page.content()
                print(f"📝 頁面內容長度: {len(page_content)} 字元")
                
                # 等待頁面載入
                await self.wait_for_page_load(page)
                
                print("✅ 頁面載入完成")
                
                # 1. 淺色模式測試
                print("\n" + "="*50)
                print("🌞 淺色模式測試")
                print("="*50)
                
                await self.take_screenshot(page, "light_mode.png", "淺色模式完整頁面")
                await self.check_theme_colors(page, "淺色")
                await self.check_data_display(page)
                
                # 2. 深色模式測試
                print("\n" + "="*50)
                print("🌙 深色模式測試")
                print("="*50)
                
                if await self.toggle_dark_mode(page):
                    await page.wait_for_timeout(2000)  # 等待深色模式完全應用
                    await self.take_screenshot(page, "dark_mode.png", "深色模式完整頁面")
                    await self.check_theme_colors(page, "深色")
                    await self.check_data_display(page)
                else:
                    print("⚠️ 無法切換深色模式，跳過深色模式測試")
                
                # 3. 生成測試報告
                await self.generate_test_report()
                
                print("\n✅ 測試完成")
                
            except Exception as e:
                print(f"❌ 測試過程中發生錯誤: {str(e)}")
                self.test_results.append({
                    'action': '測試執行',
                    'description': f'系統錯誤: {str(e)}',
                    'status': '失敗'
                })
            
            finally:
                await browser.close()
    
    async def generate_test_report(self):
        """生成測試報告"""
        print("\n📝 生成測試報告...")
        
        report_path = os.path.join("/Users/gamepig/projects/NexusERP", f"cash_flow_test_report_{self.timestamp}.md")
        
        # 統計測試結果
        total_tests = len(self.test_results)
        passed_tests = len([r for r in self.test_results if r['status'] in ['成功', '通過']])
        failed_tests = total_tests - passed_tests
        
        report_content = f"""# 現金流量表頁面顏色主題測試報告

## 測試概要
- **測試時間**: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
- **測試網址**: {self.test_url}
- **總測試項目**: {total_tests}
- **通過項目**: {passed_tests}
- **失敗項目**: {failed_tests}
- **通過率**: {(passed_tests/total_tests*100):.1f}%

## 測試結果詳情

"""
        
        # 按動作類型分組顯示結果
        actions = {}
        for result in self.test_results:
            action = result['action']
            if action not in actions:
                actions[action] = []
            actions[action].append(result)
        
        for action, results in actions.items():
            report_content += f"### {action}\n\n"
            for result in results:
                status_icon = "✅" if result['status'] in ['成功', '通過'] else "❌"
                report_content += f"- {status_icon} **{result['description']}**: {result['status']}\n"
                
                # 添加額外資訊
                if 'filename' in result:
                    report_content += f"  - 檔案: `{result['filename']}`\n"
                if 'theme' in result:
                    report_content += f"  - 主題: {result['theme']}\n"
                if 'elements_found' in result:
                    report_content += f"  - 找到元素: {result['elements_found']} 個\n"
            
            report_content += "\n"
        
        # 測試建議
        report_content += """## 測試建議

### 顏色主題檢查要點
1. **營業活動現金流**: 應使用綠色主題 (text-green-600, bg-green-50)
2. **投資活動現金流**: 應使用橘色主題 (text-orange-600, bg-orange-50)  
3. **籌資活動現金流**: 應使用藍色主題 (text-blue-600, bg-blue-50)
4. **深色模式**: 應有良好的對比度和可讀性

### 數據顯示檢查要點
1. **數值顯示**: 現金流數值應正確格式化並顯示
2. **圖表載入**: 圖表元素應正常載入和渲染
3. **表格資料**: 表格應包含完整的現金流數據

### 改進建議
"""
        
        if failed_tests > 0:
            report_content += "1. 修復失敗的測試項目\n"
            report_content += "2. 檢查 CSS 類別名稱是否正確\n"
            report_content += "3. 驗證深色模式切換功能\n"
            report_content += "4. 確保數據正確載入和顯示\n"
        else:
            report_content += "✅ 所有測試項目均通過，頁面功能正常\n"
        
        report_content += f"""
## 截圖文件
- 淺色模式: `{self.screenshot_dir}/{self.timestamp}_light_mode.png`
- 深色模式: `{self.screenshot_dir}/{self.timestamp}_dark_mode.png`

---
*測試報告由 Playwright 自動化測試工具生成*
"""
        
        # 保存報告
        with open(report_path, 'w', encoding='utf-8') as f:
            f.write(report_content)
        
        print(f"📋 測試報告已保存: {report_path}")
        self.test_results.append({
            'action': '測試報告',
            'description': '生成完整測試報告',
            'filename': report_path,
            'status': '成功'
        })

async def main():
    """主程式入口"""
    tester = CashFlowColorsTester()
    await tester.run_test()

if __name__ == "__main__":
    asyncio.run(main())