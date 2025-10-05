// src/lib/crypto.ts
// Solo en cliente. No importes esto en server components.
const ENC_ALGO = 'AES-GCM';
const DERIVE_ALGO = 'PBKDF2';
const ITER = 100_000;
const KEY_LEN = 256; // bits
const IV_LEN = 12; // bytes para GCM

const te = new TextEncoder();
const td = new TextDecoder();

// ¡Cámbiala! O mejor: inyecta por env en build y pásala al cliente.
const DEFAULT_PASSPHRASE = process.env.NEXT_PUBLIC_CRYPTO_PASSPHRASE || 'p4ssword280';

async function deriveKey(passphrase: string, salt: Uint8Array) {
  const baseKey = await crypto.subtle.importKey(
    'raw',
    te.encode(passphrase),
    { name: DERIVE_ALGO },
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: DERIVE_ALGO, salt, iterations: ITER, hash: 'SHA-256' },
    baseKey,
    { name: ENC_ALGO, length: KEY_LEN },
    false,
    ['encrypt', 'decrypt']
  );
}

function b64(buf: ArrayBuffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}
function b64ToArr(b: string) {
  const bin = atob(b);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export async function encryptJSON(obj: unknown, passphrase = DEFAULT_PASSPHRASE) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LEN));
  const key = await deriveKey(passphrase, salt);
  const plaintext = te.encode(JSON.stringify(obj));
  const ct = await crypto.subtle.encrypt({ name: ENC_ALGO, iv }, key, plaintext);
  // Guardamos salt|iv|ct en base64
  return JSON.stringify({
    s: b64(salt),
    i: b64(iv),
    c: b64(ct),
    v: 1,
  });
}

export async function decryptJSON<T = unknown>(payload: string, passphrase = DEFAULT_PASSPHRASE): Promise<T | null> {
  try {
    const { s, i, c } = JSON.parse(payload);
    const salt = b64ToArr(s);
    const iv = b64ToArr(i);
    const ct = b64ToArr(c);
    const key = await deriveKey(passphrase, salt);
    const pt = await crypto.subtle.decrypt({ name: ENC_ALGO, iv }, key, ct);
    return JSON.parse(td.decode(pt));
  } catch {
    return null;
  }
}
