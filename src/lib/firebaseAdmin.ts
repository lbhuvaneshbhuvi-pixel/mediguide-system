// Firebase Token Verification (No Admin SDK Required)
// This module decodes Firebase JWT tokens manually for development/testing

export async function verifyFirebaseIdToken(authorizationHeader?: string | null): Promise<string | null> {
  if (!authorizationHeader) return null;
  
  const token = authorizationHeader.startsWith('Bearer ') 
    ? authorizationHeader.slice(7) 
    : authorizationHeader;
    
  if (!token) return null;
  
  try {
    // Decode JWT token manually (without cryptographic verification)
    // Format: header.payload.signature
    const parts = token.split('.');

    if (parts.length !== 3) {
      console.debug('Invalid token format - expected 3 parts, got', parts.length);
      return null;
    }

    // Handle base64url -> base64 for Buffer
    const toBase64 = (str: string) => {
      let s = str.replace(/-/g, '+').replace(/_/g, '/');
      // pad with '=' to make length a multiple of 4
      while (s.length % 4 !== 0) s += '=';
      return s;
    };

    // Decode payload (second part)
    try {
      const payloadB64 = toBase64(parts[1]);
      const payload = Buffer.from(payloadB64, 'base64').toString('utf8');
      const decoded = JSON.parse(payload) as any;

      // Firebase ID tokens may use different claim keys for the uid
      const uid = decoded?.uid || decoded?.user_id || decoded?.sub || decoded?.userId;
      if (uid) {
        console.debug('✓ Token decoded successfully, uid:', uid);
        return uid;
      }

      console.debug('✗ No uid-like claim found in token payload', Object.keys(decoded || {}));
      return null;
    } catch (parseErr) {
      console.debug('✗ Failed to parse token payload:', parseErr);
      return null;
    }
  } catch (err: any) {
    console.debug('✗ Token verification error:', err.message);
    return null;
  }
}
