import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  
  await page.goto('http://127.0.0.1:8000/dashboard', { waitUntil: 'networkidle', timeout: 30000 });
  
  if (page.url().includes('/login')) {
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    await page.waitForTimeout(3000);
  }
  
  const parentInfo = await page.evaluate(() => {
    const wrapper = document.querySelector('.dashboard-info-grid-wrapper');
    let parent = wrapper;
    const parents = [];
    
    while (parent && parent !== document.body) {
      parent = parent.parentElement;
      if (parent) {
        const rect = parent.getBoundingClientRect();
        const styles = window.getComputedStyle(parent);
        parents.push({
          tagName: parent.tagName,
          className: parent.className,
          rect: { x: rect.x, width: rect.width },
          styles: {
            maxWidth: styles.maxWidth,
            width: styles.width,
            margin: styles.margin,
            padding: styles.padding
          }
        });
      }
    }
    
    return parents;
  });
  
  console.log('=== 父容器層級分析 ===');
  parentInfo.forEach((parent, index) => {
    console.log(`層級 ${index + 1}: ${parent.tagName} (${parent.className})`);
    console.log(`  位置: x=${parent.rect.x}, 寬度: ${parent.rect.width}`);
    console.log(`  樣式: maxWidth=${parent.styles.maxWidth}, width=${parent.styles.width}`);
    console.log(`  邊距: ${parent.styles.margin}, 內距: ${parent.styles.padding}`);
    console.log('');
  });
  
  await browser.close();
})();