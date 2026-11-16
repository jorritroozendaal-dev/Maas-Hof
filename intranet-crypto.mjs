// Only encrypted content is published. No password or password verifier is stored.
function bytes(value) {
  if (typeof value !== 'string') throw new Error('Invalid encrypted payload');
  return Uint8Array.from(atob(value), c => c.charCodeAt(0));
}
export async function decryptIntranet(payload, password) {
  if (payload?.version !== 1 || payload.iterations !== 600000 || typeof password !== 'string' || !password) {
    throw new Error('Invalid encrypted payload or password');
  }
  const salt = bytes(payload.salt), iv = bytes(payload.iv), encrypted = bytes(payload.encrypted);
  if (salt.length !== 16 || iv.length !== 12 || encrypted.length < 17) throw new Error('Invalid encrypted payload');
  const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
  const key = await crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:600000,hash:'SHA-256'}, material, {name:'AES-GCM',length:256}, false, ['decrypt']);
  const plain = await crypto.subtle.decrypt({name:'AES-GCM',iv}, key, encrypted);
  try {
    const content = JSON.parse(new TextDecoder('utf-8', {fatal:true}).decode(plain));
    if (typeof content.title !== 'string' || typeof content.intro !== 'string' || !Array.isArray(content.sections)) throw new Error('Invalid content');
    return content;
  } finally {
    new Uint8Array(plain).fill(0);
  }
}
