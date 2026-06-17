const http = require('http');
const { execSync, spawn } = require('child_process');
const path = require('path');

const server = spawn('npx.cmd', ['next', 'dev'], {
  cwd: __dirname,
  stdio: 'pipe',
  shell: true,
});

server.stdout.on('data', d => {
  const text = d.toString();
  process.stdout.write(text);
  if (text.includes('Ready') || text.includes('Error')) {
    setTimeout(() => {
      // Test the page
      http.get('http://localhost:3000', res => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (data.includes('Task Assignment') || data.includes('AWS SBG REC')) {
            console.log('\n✓ PAGE LOADS SUCCESSFULLY');
          } else if (data.includes('statusCode')) {
            console.error('\n✗ SERVER ERROR:', data.substring(0, 500));
          } else {
            console.log('\nPartial HTML:', data.substring(0, 300));
            console.log('\n✓ Server responded with status', res.statusCode);
          }
          process.exit(0);
        });
      }).on('error', e => {
        console.error('\nRequest error:', e.message);
        process.exit(1);
      });
    }, 3000);
  }
});

server.stderr.on('data', d => {
  const text = d.toString();
  if (text.includes('Error') || text.includes('error')) {
    process.stderr.write('[ERR] ' + text);
  }
});

setTimeout(() => {
  console.error('Timeout waiting for server');
  process.exit(1);
}, 30000);
