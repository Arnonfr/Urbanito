const fetch = require('node-fetch');

(async () => {
  try {
    const route = {
      name: 'DEBUG SERVER SAVE',
      city: 'DebugCity',
      description: 'Route saved via server fallback',
      durationMinutes: 5,
      pois: [
        { name: 'P1', lat: 32.0, lng: 34.0, category: 'test' }
      ]
    };

    const resp = await fetch('http://localhost:8080/api/save-route', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ route, preferences: { theme: 'debug' }, isPublic: true })
    });

    const text = await resp.text();
    console.log('Status:', resp.status);
    console.log('Body:', text);
  } catch (e) {
    console.error('Failed:', e);
  }
})();
