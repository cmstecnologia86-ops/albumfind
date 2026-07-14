export const PIN_SESSION_COOKIE = "albumfind-pin-session";

const SESSION_PAYLOAD = "albumfind-pin-access-v1";

function toHex(bytes: ArrayBuffer) {
  return Array.from(new Uint8Array(bytes))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function sha256(value: string) {
  const data = new TextEncoder().encode(value);
  return toHex(await crypto.subtle.digest("SHA-256", data));
}

export async function isValidPin(candidate: string) {
  const expectedPin = process.env.ALBUMFIND_PIN;

  if (!expectedPin || !/^\d{4}$/.test(expectedPin)) {
    return false;
  }

  const [candidateHash, expectedHash] = await Promise.all([
    sha256(candidate),
    sha256(expectedPin),
  ]);

  return candidateHash === expectedHash;
}

export async function createPinSessionToken() {
  const secret = process.env.ALBUMFIND_AUTH_SECRET;

  if (!secret || secret.length < 24) {
    throw new Error("ALBUMFIND_AUTH_SECRET is not configured securely.");
  }

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(SESSION_PAYLOAD),
  );

  return toHex(signature);
}

export async function hasValidPinSession(token?: string) {
  if (!token) {
    return false;
  }

  try {
    return token === (await createPinSessionToken());
  } catch {
    return false;
  }
}
