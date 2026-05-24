async function run() {
  console.log('Sending POST to generate competitor general report...');
  try {
    const res = await fetch('http://localhost:3000/api/competitors/cmp31dubn0000xklh3gwdxaiw/generate-general-report', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log('Response Status:', res.status, res.statusText);
    const text = await res.text();
    console.log('Response Body:', text.substring(0, 1000));
  } catch (error) {
    console.error('Error triggering endpoint:', error);
  }
}

run();
