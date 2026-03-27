// lib/storage.js — AES-256-GCM encrypted localStorage

const ENC_KEY_NAME = "solmarket_key_v1";
const ENC_STORE_KEY = "solmarket_enc_v1";
let _cryptoKey = null;

async function getOrCreateKey() {
  if (_cryptoKey) return _cryptoKey;
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(ENC_KEY_NAME);
    if (raw) {
      const keyData = Uint8Array.from(atob(raw), (c) => c.charCodeAt(0));
      _cryptoKey = await crypto.subtle.importKey("raw", keyData, "AES-GCM", false, ["encrypt", "decrypt"]);
    } else {
      _cryptoKey = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
      const exported = await crypto.subtle.exportKey("raw", _cryptoKey);
      localStorage.setItem(ENC_KEY_NAME, btoa(String.fromCharCode(...new Uint8Array(exported))));
    }
  } catch { _cryptoKey = null; }
  return _cryptoKey;
}

export async function encSave(data) {
  if (typeof window === "undefined") return;
  try {
    const key = await getOrCreateKey();
    if (!key) { localStorage.setItem(ENC_STORE_KEY, JSON.stringify(data)); return; }
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const enc = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(JSON.stringify(data)));
    const combined = new Uint8Array(iv.length + enc.byteLength);
    combined.set(iv); combined.set(new Uint8Array(enc), iv.length);
    localStorage.setItem(ENC_STORE_KEY, btoa(String.fromCharCode(...combined)));
  } catch { localStorage.setItem(ENC_STORE_KEY, JSON.stringify(data)); }
}

export async function encLoad() {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(ENC_STORE_KEY);
    if (!raw) return {};
    const key = await getOrCreateKey();
    if (key) {
      try {
        const combined = Uint8Array.from(atob(raw), (c) => c.charCodeAt(0));
        const iv = combined.slice(0, 12);
        const data = combined.slice(12);
        const dec = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, data);
        return JSON.parse(new TextDecoder().decode(dec));
      } catch {}
    }
    try { return JSON.parse(raw); } catch { return {}; }
  } catch { return {}; }
}

export async function sha256hex(str) {
  if (typeof window === "undefined") return "";
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function setAdminCodeHash(code) {
  const hash = await sha256hex(code.trim());
  const stored = await encLoad();
  await encSave({ ...stored, _adminCodeHash: hash });
}

export async function verifyAdminCode(inputCode) {
  const stored = await encLoad();
  if (!stored._adminCodeHash) return false;
  const inputHash = await sha256hex(inputCode.trim());
  return inputHash === stored._adminCodeHash;
}
