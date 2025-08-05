#!/usr/bin/env python3
"""
NexusERP 報表頁面截圖分析工具
使用 Playwright 來截圖並檢查實際的圖表顯示狀況
"""

import asyncio
from playwright.async_api import async_playwright
import os
from datetime import datetime

class ReportChecker:
    def __init__(self):
        self.base_url = "http://127.0.0.1:8000"
        self.login_email = "test@example.com"
        self.login_password = "password123"
        self.screenshots_dir = "report_screenshots"
        
    async def setup_browser(self):
        """設定瀏覽器"""
        self.playwright = await async_playwright().start()
        self.browser = await self.playwright.chromium.launch(headless=False)
        self.context = await self.browser.new_context(
            viewport={'width': 1920, 'height': 1080}
        )
        self.page = await self.context.new_page()
        
        # 建立截圖目錄
        os.makedirs(self.screenshots_dir, exist_ok=True)
        
    async def login(self):
        """登入系統"""
        print("正在登入系統...")
        await self.page.goto(f"{self.base_url}/login")
        await self.page.wait_for_load_state('networkidle')
        
        # 填入登入資訊
        await self.page.fill('input[name="email"]', self.login_email)
        await self.page.fill('input[name="password"]', self.login_password)
        await self.page.click('button[type="submit"]')
        
        # 等待登入完成
        await self.page.wait_for_url(f"{self.base_url}/dashboard", timeout=10000)
        print("登入成功!")
        
    async def check_report_page(self, url_path, page_name):
        """檢查單個報表頁面"""
        full_url = f"{self.base_url}{url_path}"
        print(f"\n正在檢查: {page_name} ({url_path})")
        
        try:
            await self.page.goto(full_url)
            await self.page.wait_for_load_state('networkidle')
            
            # 等待可能的 AJAX 請求完成
            await asyncio.sleep(3)
            
            # 截圖
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            screenshot_path = f"{self.screenshots_dir}/{page_name}_{timestamp}.png"
            await self.page.screenshot(path=screenshot_path, full_page=True)
            
            # 檢查圖表元素
            charts = await self.page.query_selector_all('canvas')
            tables = await self.page.query_selector_all('table')
            
            print(f"  ✓ 截圖已保存: {screenshot_path}")
            print(f"  📊 發現 {len(charts)} 個圖表元素")
            print(f"  📋 發現 {len(tables)} 個表格元素")
            
            # 檢查是否有錯誤訊息
            error_elements = await self.page.query_selector_all('.error, .alert-danger, [class*="error"]')
            if error_elements:
                print(f"  ⚠️ 發現 {len(error_elements)} 個錯誤元素")
                
            # 檢查是否有載入中的元素
            loading_elements = await self.page.query_selector_all('.loading, .spinner, [class*="loading"]')
            if loading_elements:
                print(f"  ⏳ 發現 {len(loading_elements)} 個載入中元素")
                
            return {
                'page_name': page_name,
                'url_path': url_path,
                'screenshot_path': screenshot_path,
                'charts_count': len(charts),
                'tables_count': len(tables),
                'errors_count': len(error_elements),
                'loading_count': len(loading_elements)
            }
            
        except Exception as e:
            print(f"  ❌ 檢查失敗: {str(e)}")
            return {
                'page_name': page_name,
                'url_path': url_path,
                'error': str(e)
            }
    
    async def check_all_reports(self):
        """檢查所有報表頁面"""
        report_pages = [
            # 銷售報表
            ('/reports/sales', '銷售總覽'),
            ('/reports/sales/by-product', '產品銷售分析'),
            ('/reports/sales/by-customer', '客戶銷售分析'),
            ('/reports/sales/trends', '銷售趨勢分析'),
            
            # 庫存報表
            ('/reports/inventory', '庫存總覽'),
            ('/reports/inventory/valuation', '庫存估價'),
            ('/reports/inventory/turnover', '庫存周轉率'),
            ('/reports/inventory/aging', '庫存老化分析'),
            ('/reports/inventory/movements', '庫存異動'),
            
            # 財務報表
            ('/reports/financial/profit-loss', '損益表'),
            ('/reports/financial/cash-flow', '現金流量表'),
            ('/reports/financial/accounts-receivable', '應收帳款'),
            ('/reports/financial/accounts-payable', '應付帳款'),
            
            # 採購報表
            ('/reports/purchase', '採購總覽'),
            ('/reports/purchase/by-supplier', '供應商分析'),
            ('/reports/purchase/by-product', '產品採購分析'),
            
            # 員工報表
            ('/reports/employees/attendance', '出勤統計'),
            ('/reports/employees/performance', '績效分析'),
        ]
        
        results = []
        for url_path, page_name in report_pages:
            result = await self.check_report_page(url_path, page_name)
            results.append(result)
            
        return results
    
    async def generate_report(self, results):
        """生成分析報告"""
        report_content = f"""# NexusERP 報表頁面實際顯示狀況分析
生成時間: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}

## 📊 總體統計

"""
        
        total_pages = len(results)
        successful_pages = len([r for r in results if 'error' not in r])
        total_charts = sum(r.get('charts_count', 0) for r in results if 'error' not in r)
        total_tables = sum(r.get('tables_count', 0) for r in results if 'error' not in r)
        
        report_content += f"""- 總頁面數: {total_pages}
- 成功載入: {successful_pages}
- 總圖表數: {total_charts}
- 總表格數: {total_tables}

## 📋 詳細頁面分析

"""
        
        for result in results:
            if 'error' in result:
                report_content += f"""### ❌ {result['page_name']} ({result['url_path']})
- 狀態: 載入失敗
- 錯誤: {result['error']}

"""
            else:
                report_content += f"""### 📄 {result['page_name']} ({result['url_path']})
- 截圖: {result['screenshot_path']}
- 圖表數量: {result['charts_count']}
- 表格數量: {result['tables_count']}
- 錯誤元素: {result['errors_count']}
- 載入中元素: {result['loading_count']}

"""
        
        # 保存報告
        report_path = f"{self.screenshots_dir}/analysis_report.md"
        with open(report_path, 'w', encoding='utf-8') as f:
            f.write(report_content)
            
        print(f"\n📝 分析報告已保存: {report_path}")
        return report_path
    
    async def cleanup(self):
        """清理資源"""
        await self.browser.close()
        await self.playwright.stop()

async def main():
    checker = ReportChecker()
    
    try:
        await checker.setup_browser()
        await checker.login()
        results = await checker.check_all_reports()
        await checker.generate_report(results)
        
    except Exception as e:
        print(f"❌ 執行過程中發生錯誤: {str(e)}")
    finally:
        await checker.cleanup()
        
    print("\n✅ 分析完成!")

if __name__ == "__main__":
    asyncio.run(main())