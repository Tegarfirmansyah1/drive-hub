// Path: lib/encryption.ts

import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
// Pastikan ENCRYPTION_KEY di .env tepat 32 karakter
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'ganti_kunci_ini_jadi_32_karakter_ya!'; 
const IV_LENGTH = 16;

/**
 * Mengenkripsi teks biasa menjadi format yang aman untuk database
 */
export function encryptToken(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  
  // Format: iv_hex:encrypted_hex
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

/**
 * Mendekripsi token dari database untuk digunakan ke Google API
 */
export function decryptToken(text: string): string {
  const textParts = text.split(':');
  const ivPart = textParts.shift();
  
  if (!ivPart) {
    throw new Error('Format token di database tidak valid.');
  }

  const iv = Buffer.from(ivPart, 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
  
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  
  return decrypted.toString();
}