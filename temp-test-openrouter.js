const fs = require('fs');
const path = require('path');

// Manually parse .env
const envFile = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
const keyMatch = envFile.match(/OPEN_ROUTER_KEY="?([^"\n]+)"?/);
const rawKey = keyMatch ? keyMatch[1] : null;

// Clean key
const cleanKey = rawKey ? rawKey.replace(/"/g, '').trim() : null;

async function testOpenRouter() {
    if (!cleanKey) {
        console.error('No key found!');
        return;
    }
    
    console.log('\nSending test request to OpenRouter with anthropic/claude-sonnet-4.5...');
    try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${cleanKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'http://localhost:3000',
                'X-Title': 'MarketHub'
            },
            body: JSON.stringify({
                model: 'anthropic/claude-sonnet-4.5',
                messages: [
                    { role: 'user', content: 'Say hello in Spanish' }
                ],
                max_tokens: 50
            })
        });
        
        console.log('Response Status:', response.status, response.statusText);
        const text = await response.text();
        console.log('Response Body:', text);
    } catch (e) {
        console.error('Fetch Error:', e);
    }
}

testOpenRouter();
