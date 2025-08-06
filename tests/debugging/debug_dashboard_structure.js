import { chromium } from 'playwright';

async function debugDashboardStructure() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🔍 導航到儀表板並檢查結構...');
    
    await page.goto('http://127.0.0.1:8000/dashboard', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });

    await page.waitForTimeout(10000);

    // 獲取完整的 HTML 結構
    const htmlStructure = await page.evaluate(() => {
      const body = document.body;
      return {
        bodyHTML: body.innerHTML.substring(0, 2000), // 前 2000 字符
        dashboardElement: document.getElementById('dashboard-loading'),
        contentElement: document.getElementById('dashboard-content'),
        allIds: Array.from(document.querySelectorAll('[id]')).map(el => el.id),
        allClasses: Array.from(document.querySelectorAll('[class]')).map(el => el.className).slice(0, 10)
      };
    });

    console.log('📊 HTML 結構分析:');
    console.log('🆔 所有 ID:', htmlStructure.allIds);
    console.log('🎨 部分 Class:', htmlStructure.allClasses);
    console.log('🔧 Dashboard Loading Element:', htmlStructure.dashboardElement ? '存在' : '不存在');
    console.log('🔧 Dashboard Content Element:', htmlStructure.contentElement ? '存在' : '不存在');
    
    // 搜尋儀表板相關元素
    const dashboardElements = await page.evaluate(() => {
      const elements = {
        byId: {
          loading: document.getElementById('dashboard-loading'),
          content: document.getElementById('dashboard-content')
        },
        byClass: {
          loading: document.querySelector('.dashboard-loading'),
          content: document.querySelector('.dashboard-content'),
          statCards: document.querySelectorAll('.stat-card'),
          charts: document.querySelectorAll('[class*="chart"]')
        },
        scripts: Array.from(document.querySelectorAll('script')).map(s => s.src || 'inline').filter(s => s.includes('dashboard') || s === 'inline')
      };
      
      return {
        loadingById: elements.byId.loading ? {
          display: window.getComputedStyle(elements.byId.loading).display,
          visibility: window.getComputedStyle(elements.byId.loading).visibility,
          className: elements.byId.loading.className
        } : null,
        contentById: elements.byId.content ? {
          display: window.getComputedStyle(elements.byId.content).display,
          visibility: window.getComputedStyle(elements.byId.content).visibility,
          className: elements.byId.content.className
        } : null,
        loadingByClass: elements.byClass.loading ? 'exists' : 'not found',
        contentByClass: elements.byClass.content ? 'exists' : 'not found',
        statCardsCount: elements.byClass.statCards.length,
        chartsCount: elements.byClass.charts.length,
        scriptsCount: elements.scripts.length,
        scripts: elements.scripts
      };
    });

    console.log('\n📊 詳細元素分析:');
    console.log('🔧 Loading (by ID):', JSON.stringify(dashboardElements.loadingById, null, 2));
    console.log('🔧 Content (by ID):', JSON.stringify(dashboardElements.contentById, null, 2));
    console.log('🔧 Loading (by Class):', dashboardElements.loadingByClass);
    console.log('🔧 Content (by Class):', dashboardElements.contentByClass);
    console.log('🔧 統計卡片數量:', dashboardElements.statCardsCount);
    console.log('🔧 圖表數量:', dashboardElements.chartsCount);
    console.log('🔧 相關腳本:', dashboardElements.scripts);

    // 檢查完整的 body 內容
    const bodyContent = await page.evaluate(() => {
      return document.body.innerHTML;
    });
    
    console.log('\n📄 Body 內容 (前 1000 字符):');
    console.log(bodyContent.substring(0, 1000));

    await page.waitForTimeout(5000);

  } catch (error) {
    console.error('❌ 調試過程中發生錯誤:', error.message);
  } finally {
    await browser.close();
  }
}

debugDashboardStructure().catch(console.error);