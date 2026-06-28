import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
if (!key) {
  console.error('No GEMINI_API_KEY or GOOGLE_API_KEY found in .env');
  process.exit(1);
}

const url = `https://generativelanguage.googleapis.com/v1/models?key=${encodeURIComponent(key)}`;

try {
  const res = await fetch(url);
  const text = await res.text();
  console.log('STATUS', res.status);
  console.log(text);
} catch (err) {
  console.error(err);
  process.exit(1);
}
