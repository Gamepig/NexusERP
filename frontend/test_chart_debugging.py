#!/usr/bin/env python3
"""
Chart Debugging Test - Check if charts are actually initializing
"""

import asyncio
from playwright.async_api import async_playwright

async def debug_charts():
    """Debug chart initialization on dashboard"""
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)
        context = await browser.new_context(viewport={'width': 1920, 'height': 1080})
        page = await context.new_page()
        
        # Collect console messages
        console_messages = []
        page.on('console', lambda msg: console_messages.append(f"[{msg.type.upper()}] {msg.text}"))
        
        # Collect network errors
        page.on('requestfailed', lambda request: print(f"❌ Request failed: {request.url} - {request.failure}"))
        
        try:
            print("🚀 Starting Chart Debug Test")
            
            # Navigate and login
            await page.goto('http://127.0.0.1:8000/dashboard')
            current_url = page.url
            if 'login' in current_url:
                await page.fill('input[name="email"]', 'test@example.com')
                await page.fill('input[name="password"]', 'password123')
                await page.click('button[type="submit"]')
                await page.wait_for_url('**/dashboard')
            
            # Wait for complete page load
            await page.wait_for_load_state('networkidle')
            await page.wait_for_timeout(5000)  # Extra wait for chart initialization
            
            # Check if Chart.js is loaded
            chart_available = await page.evaluate("typeof Chart !== 'undefined'")
            print(f"📊 Chart.js available: {chart_available}")
            
            if chart_available:
                chart_version = await page.evaluate("Chart.version")
                print(f"📊 Chart.js version: {chart_version}")
            
            # Check for chart canvas elements
            print("\n🔍 Checking Chart Canvas Elements:")
            
            revenue_canvas = await page.query_selector('#revenueChart')
            revenue_has_canvas = await revenue_canvas.query_selector('canvas') if revenue_canvas else None
            print(f"   Revenue Chart Canvas: {'✅ Found' if revenue_has_canvas else '❌ Missing'}")
            
            orders_canvas = await page.query_selector('#ordersChart')
            orders_has_canvas = await orders_canvas.query_selector('canvas') if orders_canvas else None
            print(f"   Orders Chart Canvas: {'✅ Found' if orders_has_canvas else '❌ Missing'}")
            
            inventory_canvas = await page.query_selector('#inventoryChart')
            inventory_has_canvas = await inventory_canvas.query_selector('canvas') if inventory_canvas else None
            print(f"   Inventory Chart Canvas: {'✅ Found' if inventory_has_canvas else '❌ Missing'}")
            
            # Check window.dashboardComponents
            dashboard_components_available = await page.evaluate("typeof window.dashboardComponents !== 'undefined'")
            print(f"\n🏗️ Dashboard Components available: {dashboard_components_available}")
            
            if dashboard_components_available:
                has_chart_manager = await page.evaluate("typeof window.dashboardComponents.chartManager !== 'undefined'")
                print(f"   Chart Manager available: {has_chart_manager}")
                
                if has_chart_manager:
                    chart_available_flag = await page.evaluate("window.dashboardComponents.chartManager.chartAvailable")
                    print(f"   Chart Manager chartAvailable flag: {chart_available_flag}")
                    
                    charts_count = await page.evaluate("Object.keys(window.dashboardComponents.chartManager.charts || {}).length")
                    print(f"   Initialized charts count: {charts_count}")
            
            # Try to manually trigger direct initialization
            print("\n🔧 Attempting manual chart initialization:")
            try:
                await page.evaluate("""
                    if (typeof Chart !== 'undefined') {
                        console.log('[Manual] Starting direct chart initialization');
                        
                        // Revenue Chart
                        const revenueCtx = document.getElementById('revenueChart');
                        if (revenueCtx && !revenueCtx.chart) {
                            new Chart(revenueCtx, {
                                type: 'line',
                                data: {
                                    labels: ['週一', '週二', '週三', '週四', '週五', '週六', '週日'],
                                    datasets: [{
                                        label: '營收 (NT$)',
                                        data: [120000, 190000, 85000, 150000, 95000, 145000, 180000],
                                        borderColor: 'rgb(16, 185, 129)',
                                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                        borderWidth: 3,
                                        tension: 0.4,
                                        fill: true
                                    }]
                                },
                                options: {
                                    responsive: true,
                                    maintainAspectRatio: false
                                }
                            });
                            console.log('[Manual] Revenue chart created');
                        }
                        
                        // Orders Chart
                        const ordersCtx = document.getElementById('ordersChart');
                        if (ordersCtx && !ordersCtx.chart) {
                            new Chart(ordersCtx, {
                                type: 'doughnut',
                                data: {
                                    labels: ['已完成', '處理中', '待確認', '已取消'],
                                    datasets: [{
                                        data: [650, 250, 80, 20],
                                        backgroundColor: ['rgb(16, 185, 129)', 'rgb(59, 130, 246)', 'rgb(245, 158, 11)', 'rgb(239, 68, 68)']
                                    }]
                                },
                                options: {
                                    responsive: true,
                                    maintainAspectRatio: false
                                }
                            });
                            console.log('[Manual] Orders chart created');
                        }
                        
                        // Inventory Chart
                        const inventoryCtx = document.getElementById('inventoryChart');
                        if (inventoryCtx && !inventoryCtx.chart) {
                            new Chart(inventoryCtx, {
                                type: 'bar',
                                data: {
                                    labels: ['筆記型電腦', '印表機', '螢幕', '鍵盤', '滑鼠'],
                                    datasets: [{
                                        label: '庫存量',
                                        data: [120, 95, 87, 63, 45],
                                        backgroundColor: 'rgba(139, 92, 246, 0.8)'
                                    }]
                                },
                                options: {
                                    responsive: true,
                                    maintainAspectRatio: false
                                }
                            });
                            console.log('[Manual] Inventory chart created');
                        }
                        
                        console.log('[Manual] Chart initialization complete');
                    } else {
                        console.error('[Manual] Chart.js not available');
                    }
                """)
                print("✅ Manual initialization executed")
            except Exception as e:
                print(f"❌ Manual initialization failed: {e}")
            
            # Wait for manual initialization to take effect
            await page.wait_for_timeout(2000)
            
            # Check again for canvas elements after manual init
            print("\n🔍 Checking Canvas Elements After Manual Init:")
            revenue_has_canvas_after = await revenue_canvas.query_selector('canvas') if revenue_canvas else None
            orders_has_canvas_after = await orders_canvas.query_selector('canvas') if orders_canvas else None
            inventory_has_canvas_after = await inventory_canvas.query_selector('canvas') if inventory_canvas else None
            
            print(f"   Revenue Chart Canvas: {'✅ Found' if revenue_has_canvas_after else '❌ Missing'}")
            print(f"   Orders Chart Canvas: {'✅ Found' if orders_has_canvas_after else '❌ Missing'}")
            print(f"   Inventory Chart Canvas: {'✅ Found' if inventory_has_canvas_after else '❌ Missing'}")
            
            # Take screenshot after manual initialization
            screenshot_path = "/Users/gamepig/projects/NexusERP/frontend/dashboard_debug_after_manual.png"
            await page.screenshot(path=screenshot_path, full_page=True)
            print(f"📸 Debug screenshot saved: {screenshot_path}")
            
            # Print console messages
            print(f"\n📝 Console Messages ({len(console_messages)}):")
            for i, msg in enumerate(console_messages[-20:]):  # Show last 20 messages
                print(f"   {i+1:2d}. {msg}")
            
        except Exception as e:
            print(f"❌ Debug test failed: {e}")
        
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(debug_charts())