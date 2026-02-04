const fs = require('fs');

(async () => {
  try {
    const res = await fetch('http://localhost:5173');
    const text = await res.text();
    fs.writeFileSync('tmp/served-index.html', text, 'utf8');
    console.log('SAVED');
  } catch (err) {
    console.error('ERR', err.message || err);
    process.exit(1);
  }
})();