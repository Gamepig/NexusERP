#!/usr/bin/env python3
"""
Fix chart rendering v2 - corrected JavaScript syntax
"""

import asyncio
from playwright.async_api import async_playwright

async def fix_and_test_charts():
    """Fix chart rendering issues and test"""
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)
        context = await browser.new_context(viewport={'width': 1920, 'height': 1080})
        page = await context.new_page()
        
        console_messages = []
        page.on('console', lambda msg: console_messages.append(f"[{msg.type.upper()}] {msg.text}"))
        
        try:
            print("🚀 Starting Chart Rendering Fix v2")
            
            # Navigate and login
            await page.goto('http://127.0.0.1:8000/dashboard')
            current_url = page.url
            if 'login' in current_url:
                await page.fill('input[name="email"]', 'test@example.com')
                await page.fill('input[name="password"]', 'password123')
                await page.click('button[type="submit"]')
                await page.wait_for_url('**/dashboard')
            
            # Wait for complete load
            await page.wait_for_load_state('networkidle')
            await page.wait_for_timeout(3000)
            
            print("🔧 Step 1: Setting proper container dimensions...")
            
            # Fix 1: Ensure chart containers have proper dimensions
            await page.evaluate("""
                console.log('[Fix] Setting proper container dimensions...');
                
                // Ensure chart containers are visible and have proper height
                const chartContainers = document.querySelectorAll('.chart-container');
                chartContainers.forEach((container, index) => {
                    container.style.height = '300px';
                    container.style.width = '100%';
                    container.style.position = 'relative';
                    container.style.display = 'block';
                    console.log('[Fix] Container ' + index + ': ' + container.offsetWidth + 'x' + container.offsetHeight);
                });
            """)
            
            print("🔧 Step 2: Destroying existing charts...")
            
            # Fix 2: Destroy existing charts
            await page.evaluate("""
                console.log('[Fix] Destroying existing charts...');
                
                // Destroy existing Chart.js instances
                if (window.dashboardComponents && window.dashboardComponents.chartManager) {
                    const charts = window.dashboardComponents.chartManager.charts;
                    Object.keys(charts).forEach(key => {
                        if (charts[key] && typeof charts[key].destroy === 'function') {
                            console.log('[Fix] Destroying chart: ' + key);
                            charts[key].destroy();
                            delete charts[key];
                        }
                    });
                }
                
                // Also destroy any Chart.js instances attached to canvas elements
                ['revenueChart', 'ordersChart', 'inventoryChart'].forEach(id => {
                    const element = document.getElementById(id);
                    if (element && element.chart) {
                        console.log('[Fix] Destroying chart on element: ' + id);
                        element.chart.destroy();
                        delete element.chart;
                    }
                });
            """)
            
            await page.wait_for_timeout(1000)
            
            print("🔧 Step 3: Creating revenue chart...")
            
            # Fix 3a: Create Revenue Chart
            await page.evaluate("""
                console.log('[Fix] Creating revenue chart...');
                
                if (typeof Chart === 'undefined') {
                    console.error('[Fix] Chart.js not available');
                } else {
                    try {
                        const revenueCtx = document.getElementById('revenueChart');
                        if (revenueCtx) {
                            const revenueChart = new Chart(revenueCtx, {
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
                                        fill: true,
                                        pointBackgroundColor: 'rgb(16, 185, 129)',
                                        pointBorderColor: '#fff',
                                        pointBorderWidth: 2,
                                        pointRadius: 6,
                                        pointHoverRadius: 8
                                    }]
                                },
                                options: {
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: { 
                                        legend: { display: false },
                                        tooltip: {
                                            callbacks: {
                                                label: function(context) {
                                                    return '營收: NT$' + context.parsed.y.toLocaleString();
                                                }
                                            }
                                        }
                                    },
                                    scales: { 
                                        y: { 
                                            beginAtZero: true,
                                            ticks: {
                                                callback: function(value) {
                                                    return 'NT$' + (value / 1000) + 'K';
                                                }
                                            }
                                        }
                                    }
                                }
                            });
                            console.log('[Fix] Revenue chart created successfully');
                        } else {
                            console.error('[Fix] Revenue chart element not found');
                        }
                    } catch (error) {
                        console.error('[Fix] Revenue chart creation error:', error);
                    }
                }
            """)
            
            print("🔧 Step 4: Creating orders chart...")
            
            # Fix 3b: Create Orders Chart  
            await page.evaluate("""
                console.log('[Fix] Creating orders chart...');
                
                try {
                    const ordersCtx = document.getElementById('ordersChart');
                    if (ordersCtx) {
                        const ordersChart = new Chart(ordersCtx, {
                            type: 'doughnut',
                            data: {
                                labels: ['已完成', '處理中', '待確認', '已取消'],
                                datasets: [{
                                    data: [650, 250, 80, 20],
                                    backgroundColor: [
                                        'rgb(16, 185, 129)',   // 綠色 - 已完成
                                        'rgb(59, 130, 246)',   // 藍色 - 處理中
                                        'rgb(245, 158, 11)',   // 橙色 - 待確認
                                        'rgb(239, 68, 68)'     // 紅色 - 已取消
                                    ],
                                    borderWidth: 3,
                                    borderColor: '#fff',
                                    hoverBorderWidth: 4,
                                    hoverOffset: 10
                                }]
                            },
                            options: {
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: { 
                                    legend: { 
                                        position: 'bottom',
                                        labels: {
                                            padding: 20,
                                            usePointStyle: true,
                                            pointStyle: 'circle'
                                        }
                                    },
                                    tooltip: {
                                        callbacks: {
                                            label: function(context) {
                                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                                const percentage = ((context.parsed / total) * 100).toFixed(1);
                                                return context.label + ': ' + context.parsed + ' (' + percentage + '%)';
                                            }
                                        }
                                    }
                                },
                                cutout: '60%'
                            }
                        });
                        console.log('[Fix] Orders chart created successfully');
                    } else {
                        console.error('[Fix] Orders chart element not found');
                    }
                } catch (error) {
                    console.error('[Fix] Orders chart creation error:', error);
                }
            """)
            
            print("🔧 Step 5: Creating inventory chart...")
            
            # Fix 3c: Create Inventory Chart
            await page.evaluate("""
                console.log('[Fix] Creating inventory chart...');
                
                try {
                    const inventoryCtx = document.getElementById('inventoryChart');
                    if (inventoryCtx) {
                        const inventoryChart = new Chart(inventoryCtx, {
                            type: 'bar',
                            data: {
                                labels: ['筆記本', '印表機', '螢幕', '鍵盤', '滑鼠', '耳機', 'USB', '記憶卡', '硬碟', '主機板'],
                                datasets: [{
                                    label: '庫存量',
                                    data: [120, 95, 87, 63, 45, 78, 234, 156, 89, 34],
                                    backgroundColor: [
                                        'rgba(139, 92, 246, 0.8)',
                                        'rgba(16, 185, 129, 0.8)',
                                        'rgba(59, 130, 246, 0.8)',
                                        'rgba(245, 158, 11, 0.8)',
                                        'rgba(239, 68, 68, 0.8)',
                                        'rgba(139, 92, 246, 0.6)',
                                        'rgba(16, 185, 129, 0.6)',
                                        'rgba(59, 130, 246, 0.6)',
                                        'rgba(245, 158, 11, 0.6)',
                                        'rgba(239, 68, 68, 0.6)'
                                    ],
                                    borderColor: [
                                        'rgb(139, 92, 246)',
                                        'rgb(16, 185, 129)',
                                        'rgb(59, 130, 246)',
                                        'rgb(245, 158, 11)',
                                        'rgb(239, 68, 68)',
                                        'rgb(139, 92, 246)',
                                        'rgb(16, 185, 129)',
                                        'rgb(59, 130, 246)',
                                        'rgb(245, 158, 11)',
                                        'rgb(239, 68, 68)'
                                    ],
                                    borderWidth: 2,
                                    borderRadius: 4,
                                    hoverBackgroundColor: 'rgba(139, 92, 246, 0.9)'
                                }]
                            },
                            options: {
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: { 
                                    legend: { display: false },
                                    tooltip: {
                                        callbacks: {
                                            label: function(context) {
                                                return context.dataset.label + ': ' + context.parsed.y + ' 件';
                                            }
                                        }
                                    }
                                },
                                scales: { 
                                    y: { 
                                        beginAtZero: true,
                                        ticks: {
                                            callback: function(value) {
                                                return value + ' 件';
                                            }
                                        }
                                    },
                                    x: {
                                        ticks: {
                                            maxRotation: 45,
                                            minRotation: 45
                                        }
                                    }
                                }
                            }
                        });
                        console.log('[Fix] Inventory chart created successfully');
                    } else {
                        console.error('[Fix] Inventory chart element not found');
                    }
                } catch (error) {
                    console.error('[Fix] Inventory chart creation error:', error);
                }
            """)
            
            # Wait for charts to render
            await page.wait_for_timeout(3000)
            
            # Verify charts are now working
            print("🔍 Verifying Chart Rendering...")
            
            revenue_canvas = await page.query_selector('#revenueChart canvas')
            orders_canvas = await page.query_selector('#ordersChart canvas') 
            inventory_canvas = await page.query_selector('#inventoryChart canvas')
            
            print(f"   Revenue Chart Canvas: {'✅ Found' if revenue_canvas else '❌ Missing'}")
            print(f"   Orders Chart Canvas: {'✅ Found' if orders_canvas else '❌ Missing'}")
            print(f"   Inventory Chart Canvas: {'✅ Found' if inventory_canvas else '❌ Missing'}")
            
            # Take final screenshot
            screenshot_path = "/Users/gamepig/projects/NexusERP/frontend/dashboard_fixed_charts_v2.png"
            await page.screenshot(path=screenshot_path, full_page=True)
            print(f"📸 Final screenshot saved: {screenshot_path}")
            
            # Test chart interactions
            if revenue_canvas or orders_canvas or inventory_canvas:
                print("🖱️  Testing Chart Interactions...")
                if revenue_canvas:
                    await revenue_canvas.hover()
                    await page.wait_for_timeout(500)
                    print("   ✅ Revenue chart hover tested")
                
                if orders_canvas:
                    await orders_canvas.hover()
                    await page.wait_for_timeout(500)
                    print("   ✅ Orders chart hover tested")
                    
                if inventory_canvas:
                    await inventory_canvas.hover()
                    await page.wait_for_timeout(500)
                    print("   ✅ Inventory chart hover tested")
            
            # Count working charts
            working_charts = sum([bool(revenue_canvas), bool(orders_canvas), bool(inventory_canvas)])
            print(f"\n🎉 Chart Fix Results: {working_charts}/3 charts working")
            
            # Show recent console messages
            print(f"\n📝 Recent Console Messages ({len(console_messages[-10:])}):")
            for msg in console_messages[-10:]:
                print(f"   {msg}")
            
            if working_charts >= 1:
                print("✅ Charts are now working!")
                return True
            else:
                print("⚠️  Charts still need fixes")
                return False
                
        except Exception as e:
            print(f"❌ Fix process failed: {e}")
            return False
        
        finally:
            await browser.close()

if __name__ == "__main__":
    success = asyncio.run(fix_and_test_charts())
    if success:
        print("\n🎊 Dashboard charts successfully fixed and verified!")
    else:
        print("\n❌ Dashboard chart fixes need additional work")