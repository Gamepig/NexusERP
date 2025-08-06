// Copy and paste this entire script into your browser console at http://127.0.0.1:8000/dashboard

console.log('🎨 NexusERP Colorful Light Theme Test Starting...\n');

// 1. Clear theme preference as requested
console.log('1️⃣ Clearing stored theme preference...');
localStorage.removeItem('nexus-theme');
console.log('✅ Theme preference cleared\n');

// 2. Force light theme
console.log('2️⃣ Applying light theme...');
document.documentElement.setAttribute('data-theme', 'light');
document.documentElement.classList.add('light-theme');
document.documentElement.classList.remove('dark-theme', 'dark');
console.log('✅ Light theme applied\n');

// Wait a moment for styles to apply
setTimeout(() => {
    console.log('3️⃣ Inspecting current theme state...');
    
    // Check HTML attributes
    const htmlElement = document.documentElement;
    const currentDataTheme = htmlElement.getAttribute('data-theme');
    const hasLightThemeClass = htmlElement.classList.contains('light-theme');
    
    console.log('📋 Current Theme State:');
    console.log(`   data-theme attribute: ${currentDataTheme}`);
    console.log(`   has light-theme class: ${hasLightThemeClass}`);
    console.log(`   localStorage nexus-theme: ${localStorage.getItem('nexus-theme')}`);
    console.log('');
    
    // Check Quick Action Cards
    console.log('4️⃣ Checking Quick Action Cards...');
    const cards = document.querySelectorAll('.nexus-quick-action-card');
    
    if (cards.length > 0) {
        console.log(`📦 Found ${cards.length} quick action cards:`);
        
        cards.forEach((card, index) => {
            const style = getComputedStyle(card);
            const hasGradient = style.background.includes('gradient') || style.backgroundImage.includes('gradient');
            const backgroundColor = style.backgroundColor;
            const background = style.background.substring(0, 100) + '...';
            
            console.log(`   Card ${index + 1}:`);
            console.log(`     Has gradient: ${hasGradient}`);
            console.log(`     Background: ${background}`);
            console.log(`     Background color: ${backgroundColor}`);
            console.log('');
        });
    } else {
        console.log('❌ No quick action cards found');
    }
    
    // Check Statistics Container
    console.log('5️⃣ Checking Statistics Container...');
    const statsGrid = document.getElementById('statsGrid');
    
    if (statsGrid) {
        const style = getComputedStyle(statsGrid);
        const backgroundColor = style.backgroundColor;
        const background = style.background.substring(0, 100) + '...';
        const border = style.border;
        
        // Check if it's light background (not dark)
        const isDarkBackground = backgroundColor.includes('rgb(45, 49, 66)') || backgroundColor.includes('rgb(26, 29, 41)');
        
        console.log('📊 Statistics Container:');
        console.log(`   Background: ${background}`);
        console.log(`   Background color: ${backgroundColor}`);
        console.log(`   Border: ${border}`);
        console.log(`   Is light background: ${!isDarkBackground}`);
        console.log('');
    } else {
        console.log('❌ Statistics container not found');
    }
    
    // Check CSS Variables
    console.log('6️⃣ Checking Light Theme CSS Variables...');
    const rootStyle = getComputedStyle(document.documentElement);
    
    const cssVars = [
        '--primary-500',
        '--orange-500', 
        '--blue-500',
        '--green-500',
        '--gray-50',
        '--gray-200'
    ];
    
    console.log('🎨 CSS Variables:');
    cssVars.forEach(varName => {
        const value = rootStyle.getPropertyValue(varName).trim();
        console.log(`   ${varName}: ${value || 'Not found'}`);
    });
    console.log('');
    
    // Check Theme Toggle Button
    console.log('7️⃣ Checking Theme Toggle Button...');
    const themeToggle = document.querySelector('[data-theme-toggle]');
    
    if (themeToggle) {
        console.log('✅ Theme toggle button found');
        console.log('   You can click it to switch between themes');
        
        // Test theme toggle
        console.log('🔄 Testing theme toggle...');
        themeToggle.click();
        
        setTimeout(() => {
            const newTheme = document.documentElement.getAttribute('data-theme');
            console.log(`   Theme after toggle: ${newTheme}`);
            
            // Toggle back to light
            themeToggle.click();
            
            setTimeout(() => {
                const finalTheme = document.documentElement.getAttribute('data-theme');
                console.log(`   Theme after second toggle: ${finalTheme}`);
            }, 500);
        }, 500);
        
    } else {
        console.log('⚠️ Theme toggle button not found');
        console.log('   You can manually switch themes with:');
        console.log('   document.documentElement.setAttribute("data-theme", "dark")');
        console.log('   document.documentElement.setAttribute("data-theme", "light")');
    }
    
    console.log('');
    console.log('🏁 Test Complete! Results:');
    console.log('');
    
    // Summary
    const summary = {
        'Theme Applied': currentDataTheme === 'light' && hasLightThemeClass,
        'Quick Action Cards Found': cards.length > 0,
        'Statistics Container Found': !!statsGrid,
        'Theme Toggle Available': !!themeToggle,
        'Expected Light Theme': currentDataTheme === 'light'
    };
    
    console.log('📊 Summary:');
    Object.entries(summary).forEach(([key, value]) => {
        const status = value ? '✅' : '❌';
        console.log(`   ${status} ${key}: ${value}`);
    });
    
    console.log('');
    console.log('🎯 Expected Visual Results:');
    console.log('   • Quick Action Cards: Colorful gradients (purple, orange, blue, green)');
    console.log('   • Statistics Container: Light gray background (not dark)');
    console.log('   • All Cards: Visible borders and shadows');
    console.log('   • Text: High contrast and readable');
    console.log('');
    console.log('🔍 If results look good, the colorful light theme is working correctly!');
    
}, 1000);

// Optional: Reload to test default behavior
console.log('');
console.log('💡 Optional: Run this command to test default theme behavior:');
console.log('location.reload();');