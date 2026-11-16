import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { decryptIntranet } from '../intranet-crypto.mjs';
const password = 'test-fixture-password-only';
const content = {title:'Fixture intranet',intro:'Test text',sections:[]};
const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
const material = await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveKey']);
const key = await crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:600000,hash:'SHA-256'},material,{name:'AES-GCM',length:256},false,['encrypt']);
const cipher = await crypto.subtle.encrypt({name:'AES-GCM',iv},key,new TextEncoder().encode(JSON.stringify(content)));
const b64 = b => Buffer.from(b).toString('base64');
const payload = {version:1,iterations:600000,salt:b64(salt),iv:b64(iv),encrypted:b64(cipher)};
test('intranet content is returned only after successful password decryption',async()=>{
  assert.deepEqual(await decryptIntranet(payload,password),content);
  await assert.rejects(decryptIntranet(payload,'wrong-fixture-password'));
});
test('authenticated encryption rejects changed ciphertext, salt and IV',async()=>{
  for (const field of ['encrypted','salt','iv']) {
    const changed=Buffer.from(payload[field],'base64');changed[0]^=1;
    await assert.rejects(decryptIntranet({...payload,[field]:b64(changed)},password));
  }
});
test('malformed payloads and unexpected key derivation parameters fail closed',async()=>{
  for (const bad of [null,{}, {...payload,iterations:1},{...payload,version:2},{...payload,iv:''}]) await assert.rejects(decryptIntranet(bad,password));
});
test('public intranet payload has only encrypted fields and is excluded from the sitemap',async()=>{
  const actual=JSON.parse(await readFile(new URL('../intranet-payload.json',import.meta.url),'utf8'));
  assert.deepEqual(Object.keys(actual).sort(),['encrypted','iterations','iv','salt','version']);
  const sitemap=await readFile(new URL('../sitemap.xml',import.meta.url),'utf8');
  assert.ok(!sitemap.includes('intranet.html'));
  const page=await readFile(new URL('../intranet.html',import.meta.url),'utf8');
  assert.match(page,/noindex,nofollow,noarchive/);
  assert.match(page,/type="password"/);
});
