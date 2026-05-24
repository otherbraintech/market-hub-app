async function searchModels() {
    try {
        const response = await fetch('https://openrouter.ai/api/v1/models');
        const data = await response.json();
        
        console.log('Search for "sonnet" in model IDs:');
        const sonnets = data.data.filter(m => m.id.toLowerCase().includes('sonnet'));
        sonnets.forEach(m => console.log(`- ${m.id} (${m.name})`));
        
        console.log('\nSearch for "3.5" in model IDs:');
        const threeFives = data.data.filter(m => m.id.toLowerCase().includes('3.5'));
        threeFives.forEach(m => console.log(`- ${m.id} (${m.name})`));
        
        console.log('\nSearch for "anthropic" in model IDs:');
        const anthropic = data.data.filter(m => m.id.toLowerCase().includes('anthropic'));
        anthropic.forEach(m => console.log(`- ${m.id} (${m.name})`));
    } catch (e) {
        console.error(e);
    }
}
searchModels();
