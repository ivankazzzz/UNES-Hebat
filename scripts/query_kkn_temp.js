import fs from 'fs';
import path from 'path';

const envPath = path.resolve('.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envKeys = [];
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    envKeys.push(parts[0].trim());
  }
});
console.log("Kunci ENV yang tersedia:", envKeys.join(', '));
