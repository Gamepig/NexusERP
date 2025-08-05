/**
 * 測試腳本 - 檢查導航文字方向問題
 * 在瀏覽器控制台中運行此腳本
 */

console.log('開始檢查導航文字方向問題...');

// 檢查所有可能有問題的元素
function checkTextDirection() {
    const results = {
        total: 0,
        fixed: 0,
        problems: []
    };
    
    // 查找所有包含中文文字的元素
    const allElements = document.querySelectorAll('*');
    const chineseTexts = ['財務會計', '庫存管理', '報價管理', '客戶關係管理', '產品與庫存'];
    
    allElements.forEach(element => {
        const text = element.textContent?.trim();
        if (chineseTexts.includes(text)) {
            results.total++;
            
            const computed = window.getComputedStyle(element);
            const writingMode = computed.writingMode;
            const textOrientation = computed.textOrientation;
            const direction = computed.direction;
            const transform = computed.transform;
            
            const info = {
                element: element,
                text: text,
                writingMode: writingMode,
                textOrientation: textOrientation,
                direction: direction,
                transform: transform,
                isHorizontal: writingMode === 'horizontal-tb' && direction === 'ltr' && transform === 'none'
            };
            
            if (info.isHorizontal) {
                results.fixed++;
            } else {
                results.problems.push(info);
            }
            
            console.log(`元素: "${text}"`, info);
        }
    });
    
    console.log('檢查結果:', results);
    return results;
}

// 強制修復問題元素
function forceFix() {
    console.log('強制修復文字方向問題...');
    
    const chineseTexts = ['財務會計', '庫存管理', '報價管理', '客戶關係管理', '產品與庫存'];
    let fixedCount = 0;
    
    const allElements = document.querySelectorAll('*');
    allElements.forEach(element => {
        const text = element.textContent?.trim();
        if (chineseTexts.includes(text)) {
            element.style.setProperty('writing-mode', 'initial', 'important');
            element.style.setProperty('text-orientation', 'initial', 'important');
            element.style.setProperty('direction', 'ltr', 'important');
            element.style.setProperty('transform', 'none', 'important');
            
            // 也修復父容器
            let parent = element.parentElement;
            let level = 0;
            while (parent && level < 3) {
                if (window.getComputedStyle(parent).display === 'flex') {
                    parent.style.setProperty('flex-direction', 'row', 'important');
                    parent.style.setProperty('align-items', 'center', 'important');
                }
                parent.style.setProperty('writing-mode', 'initial', 'important');
                parent.style.setProperty('text-orientation', 'initial', 'important');
                parent.style.setProperty('direction', 'ltr', 'important');
                
                parent = parent.parentElement;
                level++;
            }
            
            fixedCount++;
        }
    });
    
    console.log(`已修復 ${fixedCount} 個元素`);
    
    // 再次檢查
    setTimeout(() => {
        console.log('修復後重新檢查:');
        checkTextDirection();
    }, 500);
}

// 立即檢查
checkTextDirection();

// 暴露函數供手動調用
window.checkNavTextDirection = checkTextDirection;
window.forceFixNavTextDirection = forceFix;

console.log('測試腳本已載入。可以使用:');
console.log('- checkNavTextDirection() 檢查問題');
console.log('- forceFixNavTextDirection() 強制修復');