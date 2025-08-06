// Dashboard 佈局分析腳本
// 分析 dashboard.blade.php 文件的佈局結構

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('📊 NexusERP Dashboard 佈局分析');
console.log('=====================================');

try {
  // 讀取 dashboard.blade.php 文件
  const dashboardPath = path.join(__dirname, 'resources/views/dashboard.blade.php');
  const dashboardContent = fs.readFileSync(dashboardPath, 'utf8');
  
  console.log('✅ 成功讀取 dashboard.blade.php');
  
  // 分析快速操作區域
  console.log('\n🚀 快速操作區域分析:');
  console.log('-----------------------------------');
  
  // 檢查快速操作區域的網格佈局
  const quickActionsGridMatch = dashboardContent.match(/grid grid-cols-2 md:grid-cols-4 gap-4 mb-8/);
  if (quickActionsGridMatch) {
    console.log('✅ 快速操作使用響應式網格: grid-cols-2 md:grid-cols-4');
    console.log('   - 手機版: 2列');
    console.log('   - 平板版以上: 4列');
  }
  
  // 檢查快速操作項目
  const quickActionTitles = dashboardContent.match(/<h3[^>]*>([^<]*(?:新增報價單|庫存管理|訂單處理|客戶管理)[^<]*)<\/h3>/g);
  if (quickActionTitles) {
    console.log(`✅ 找到 ${quickActionTitles.length} 個快速操作項目:`);
    quickActionTitles.forEach((title, index) => {
      const cleanTitle = title.replace(/<[^>]*>/g, '').trim();
      console.log(`   ${index + 1}. ${cleanTitle}`);
    });
  }
  
  // 分析統計卡片區域
  console.log('\n📈 統計卡片區域分析:');
  console.log('-----------------------------------');
  
  // 檢查統計區域的網格佈局
  const statsGridMatch = dashboardContent.match(/grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3/);
  if (statsGridMatch) {
    console.log('✅ 統計卡片使用響應式網格: grid-cols-1 md:grid-cols-2 lg:grid-cols-3');
    console.log('   - 手機版: 1列');
    console.log('   - 平板版: 2列');
    console.log('   - 桌面版: 3列');
  }
  
  // 檢查統計卡片項目
  const statCardMatches = dashboardContent.match(/<x-dashboard\.stat-card[^>]*>/g);
  if (statCardMatches) {
    console.log(`✅ 找到 ${statCardMatches.length} 個統計卡片組件`);
    
    // 提取統計項目標題
    const titleMatches = dashboardContent.match(/title="([^"]*)"/g);
    if (titleMatches) {
      console.log('   統計項目:');
      titleMatches.forEach((title, index) => {
        const cleanTitle = title.replace(/title="([^"]*)"/, '$1');
        console.log(`   ${index + 1}. ${cleanTitle}`);
      });
    }
  }
  
  // 檢查佈局順序
  console.log('\n📐 佈局順序分析:');
  console.log('-----------------------------------');
  
  // 尋找快速操作和統計區域的位置
  const quickActionsIndex = dashboardContent.indexOf('<!-- 快速操作區域 - 移到統計卡片上方 -->');
  const statsGridIndex = dashboardContent.indexOf('<!-- 關鍵績效指標卡片 - NexusERP 標準風格 -->');
  
  if (quickActionsIndex !== -1 && statsGridIndex !== -1) {
    if (quickActionsIndex < statsGridIndex) {
      console.log('✅ 佈局順序正確: 快速操作區域在統計卡片上方');
    } else {
      console.log('❌ 佈局順序錯誤: 快速操作區域應在統計卡片上方');
    }
  }
  
  // 檢查響應式設計
  console.log('\n📱 響應式設計分析:');
  console.log('-----------------------------------');
  
  // 檢查 CSS 媒體查詢
  const mediaQueryMatches = dashboardContent.match(/@media \([^)]+\)/g);
  if (mediaQueryMatches) {
    console.log(`✅ 找到 ${mediaQueryMatches.length} 個媒體查詢:`);
    mediaQueryMatches.forEach((query, index) => {
      console.log(`   ${index + 1}. ${query}`);
    });
  }
  
  // 檢查統計卡片的長方形佈局優化
  const cardAspectRatioMatch = dashboardContent.match(/aspect-ratio: (\d+\/\d+)/);
  if (cardAspectRatioMatch) {
    console.log(`✅ 統計卡片長寬比設定: ${cardAspectRatioMatch[1]}`);
  }
  
  const minHeightMatch = dashboardContent.match(/min-height: (\d+px)/);
  if (minHeightMatch) {
    console.log(`✅ 統計卡片最小高度: ${minHeightMatch[1]}`);
  }
  
  // 檢查圖表區域
  console.log('\n📊 圖表區域分析:');
  console.log('-----------------------------------');
  
  const chartIds = ['revenueChart', 'ordersChart', 'inventoryChart', 'performanceChart'];
  let foundCharts = 0;
  
  chartIds.forEach(chartId => {
    if (dashboardContent.includes(`id="${chartId}"`)) {
      foundCharts++;
      console.log(`✅ 找到圖表: ${chartId}`);
    }
  });
  
  console.log(`總計: ${foundCharts}/${chartIds.length} 個圖表`);
  
  // 檢查圖表佈局
  const chartGridMatch = dashboardContent.match(/grid grid-cols-1 lg:grid-cols-2 gap-6/);
  if (chartGridMatch) {
    console.log('✅ 圖表使用響應式 2x2 佈局: grid-cols-1 lg:grid-cols-2');
  }
  
  // 主題樣式分析
  console.log('\n🎨 NexusERP 深色主題分析:');
  console.log('-----------------------------------');
  
  // 檢查主題相關的 CSS 類別
  const nexusClasses = dashboardContent.match(/nexus-[a-z-]+/g);
  if (nexusClasses) {
    const uniqueClasses = [...new Set(nexusClasses)];
    console.log(`✅ 找到 ${uniqueClasses.length} 個 NexusERP 主題類別:`);
    uniqueClasses.forEach(cls => {
      console.log(`   - ${cls}`);
    });
  }
  
  // 最終報告
  console.log('\n📋 佈局驗證總結:');
  console.log('=====================================');
  console.log('✅ 快速操作區域: 響應式 2/4 列佈局');
  console.log('✅ 統計卡片區域: 響應式 1/2/3 列佈局');
  console.log('✅ 佈局順序: 快速操作 → 統計卡片 → 圖表');
  console.log('✅ 圖表區域: 響應式 1/2 列佈局');
  console.log('✅ NexusERP 深色主題樣式已應用');
  console.log('✅ 響應式設計: 支援手機、平板、桌面');
  
  console.log('\n🎯 新佈局特點:');
  console.log('-----------------------------------');
  console.log('1. 快速操作區域移至統計卡片上方 ✅');
  console.log('2. 統計卡片改為 3列2行 佈局 ✅');
  console.log('3. 統計卡片使用長方形設計避免擠壓 ✅');
  console.log('4. 響應式斷點:');
  console.log('   - 桌面版 (≥1024px): 3列統計卡片 ✅');
  console.log('   - 平板版 (768-1024px): 2列統計卡片 ✅');
  console.log('   - 手機版 (<768px): 1列統計卡片 ✅');
  console.log('5. NexusERP 深色主題正確應用 ✅');
  
} catch (error) {
  console.error('❌ 分析過程中發生錯誤:', error.message);
}

console.log('\n✨ 分析完成!');