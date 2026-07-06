/**
 * BerdikariPOS — Ngrok Tunnel
 * 
 * SETUP (sekali saja):
 * 1. Daftar gratis di https://dashboard.ngrok.com/signup
 * 2. Copy authtoken dari dashboard
 * 3. Jalankan: npx ngrok config add-authtoken YOUR_TOKEN_HERE
 * 
 * PENGGUNAAN:
 * Terminal 1: npm run dev
 * Terminal 2: npm run tunnel
 */

import { spawn } from 'child_process';
import http from 'http';

const PORT = 5173;

// Start ngrok via CLI
const ngrok = spawn('npx', ['ngrok', 'http', String(PORT), '--log', 'stdout'], {
  shell: true,
  stdio: ['ignore', 'pipe', 'pipe'],
});

let publicUrl = null;

ngrok.stdout.on('data', (data) => {
  const line = data.toString();
  
  // Extract public URL from log output
  const urlMatch = line.match(/url=(https:\/\/[^\s]+)/);
  if (urlMatch && !publicUrl) {
    publicUrl = urlMatch[1];
    console.log('\n┌──────────────────────────────────────────────────┐');
    console.log('│  🚀 BerdikariPOS — Public Tunnel Active           │');
    console.log('├──────────────────────────────────────────────────┤');
    console.log(`│  Local:   http://localhost:${PORT}`);
    console.log(`│  Public:  ${publicUrl}`);
    console.log('├──────────────────────────────────────────────────┤');
    console.log('│  Share URL di atas untuk akses dari mana saja!    │');
    console.log('└──────────────────────────────────────────────────┘');
    console.log('\nTekan Ctrl+C untuk stop.\n');
  }
});

ngrok.stderr.on('data', (data) => {
  const msg = data.toString().trim();
  if (msg) console.error(msg);
});

ngrok.on('close', (code) => {
  if (code !== 0 && !publicUrl) {
    console.error(`\n❌ Ngrok exited with code ${code}`);
    console.log('\n📋 Pastikan:');
    console.log('   1. Dev server sudah jalan: npm run dev');
    console.log('   2. Authtoken sudah dipasang: npx ngrok config add-authtoken TOKEN\n');
  }
  process.exit(code);
});

// Wait a moment then try to get URL from ngrok API
setTimeout(async () => {
  if (publicUrl) return;
  try {
    const res = await fetch('http://127.0.0.1:4040/api/tunnels');
    const data = await res.json();
    if (data.tunnels && data.tunnels.length > 0) {
      publicUrl = data.tunnels[0].public_url;
      console.log('\n┌──────────────────────────────────────────────────┐');
      console.log('│  🚀 BerdikariPOS — Public Tunnel Active           │');
      console.log('├──────────────────────────────────────────────────┤');
      console.log(`│  Local:   http://localhost:${PORT}`);
      console.log(`│  Public:  ${publicUrl}`);
      console.log('├──────────────────────────────────────────────────┤');
      console.log('│  Share URL di atas untuk akses dari mana saja!    │');
      console.log('└──────────────────────────────────────────────────┘');
      console.log('\nTekan Ctrl+C untuk stop.\n');
    }
  } catch (e) {
    // API not ready yet, will retry
  }
}, 3000);

// Retry after 6 seconds if still no URL
setTimeout(async () => {
  if (publicUrl) return;
  try {
    const res = await fetch('http://127.0.0.1:4040/api/tunnels');
    const data = await res.json();
    if (data.tunnels && data.tunnels.length > 0) {
      publicUrl = data.tunnels[0].public_url;
      console.log(`\n🌐 Public URL: ${publicUrl}\n`);
    }
  } catch (e) {
    console.log('\n⏳ Tunnel sedang connecting... Cek http://127.0.0.1:4040 untuk status.\n');
  }
}, 6000);

process.on('SIGINT', () => {
  ngrok.kill();
  process.exit(0);
});
