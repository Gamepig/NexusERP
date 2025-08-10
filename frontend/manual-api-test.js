// Manual API test to verify status issue
const https = require('https');

async function testStatusIssue() {
    console.log('🔍 Testing API status override issue...');
    
    // First get a valid token by checking login
    const loginData = JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
    });

    console.log('📤 Attempting to create quote with "sent" status...');
    
    // Test data with "sent" status
    const quoteData = JSON.stringify({
        customer_id: 1,
        status: 'sent',  // Frontend wants "sent"
        description: 'API Test Quote for Status Verification',
        quote_date: '2025-08-07',
        valid_until: '2025-09-06',
        contact_person: 'Test Person',
        items: []
    });

    console.log('📋 Request payload:', quoteData);
    console.log('🎯 Expected backend behavior: Force status to "draft"');
}

testStatusIssue();