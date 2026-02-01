#!/bin/bash

# JWKS Registry Population Script
# Fetches Google/Apple RSA keys and populates the on-chain JWKS Registry

PROFILE="dev"
ACCOUNT="my_account"
JWKS_REGISTRY="0x06bcc7ef185e0ad2ba3dfc4a71455d73b3dc674bef6ef18f2ce0889b594235e0"

echo "==========================================="
echo "JWKS Registry Population - Sepolia"
echo "==========================================="
echo ""
echo "Registry address: $JWKS_REGISTRY"
echo ""

# Fetch Google JWKS
echo "[1/3] Fetching Google JWKS keys..."
GOOGLE_JWKS=$(curl -s "https://www.googleapis.com/oauth2/v3/certs")

if [ -z "$GOOGLE_JWKS" ]; then
    echo "ERROR: Failed to fetch Google JWKS"
    exit 1
fi

echo "Google JWKS fetched successfully"
echo ""

# Parse and format keys using Node.js
echo "[2/3] Formatting keys for on-chain submission..."

# Create a temporary Node.js script to process the keys
cat > /tmp/format_jwks.js << 'NODEJS_SCRIPT'
const jwks = JSON.parse(process.argv[2]);

function base64UrlToBytes(base64url) {
  const base64 = base64url
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(base64url.length + (4 - (base64url.length % 4)) % 4, '=');

  const binary = Buffer.from(base64, 'base64');
  return new Uint8Array(binary);
}

function bytesToU128Limbs(bytes) {
  // Pad to 256 bytes if needed (2048 bits)
  const padded = new Uint8Array(256);
  padded.set(bytes, 256 - bytes.length);

  const limbs = [];
  // Process from end to start (little-endian)
  for (let i = 15; i >= 0; i--) {
    let limb = 0n;
    for (let j = 0; j < 16; j++) {
      const byteIdx = i * 16 + j;
      limb = limb * 256n + BigInt(padded[byteIdx]);
    }
    limbs.push(limb.toString());
  }
  return limbs;
}

function kidToFelt(kid) {
  const bytes = Buffer.from(kid, 'utf8');
  let felt = 0n;
  for (let i = 0; i < bytes.length && i < 31; i++) {
    felt = felt * 256n + BigInt(bytes[i]);
  }
  return felt.toString();
}

const GOOGLE_PROVIDER = '0x676f6f676c65'; // 'google' as felt252
const VALID_UNTIL = '0'; // No expiry (admin can remove keys when rotated)
const IS_ACTIVE = '1';

const results = [];

for (const key of jwks.keys) {
  if (key.kty !== 'RSA' || key.alg !== 'RS256') continue;

  const nBytes = base64UrlToBytes(key.n);
  const nLimbs = bytesToU128Limbs(nBytes);

  const kidFelt = kidToFelt(key.kid);

  // Format calldata for set_key(kid, JWKSKey)
  // JWKSKey struct: n0-n15 (16 u128), provider (felt252), valid_until (u64), is_active (bool)
  const calldata = [
    kidFelt,           // kid
    ...nLimbs,         // n0-n15 (16 limbs)
    GOOGLE_PROVIDER,   // provider
    VALID_UNTIL,       // valid_until
    IS_ACTIVE          // is_active
  ];

  results.push({
    kid: key.kid,
    kidFelt,
    calldata: calldata.join(' ')
  });
}

console.log(JSON.stringify(results, null, 2));
NODEJS_SCRIPT

FORMATTED_KEYS=$(node /tmp/format_jwks.js "$GOOGLE_JWKS")

if [ -z "$FORMATTED_KEYS" ]; then
    echo "ERROR: Failed to format keys"
    exit 1
fi

echo "Formatted keys:"
echo "$FORMATTED_KEYS" | jq -r '.[] | "  - \(.kid)"'
echo ""

# Submit keys to JWKS Registry
echo "[3/3] Submitting keys to JWKS Registry..."
echo ""

KEY_COUNT=$(echo "$FORMATTED_KEYS" | jq 'length')
CURRENT=1

echo "$FORMATTED_KEYS" | jq -c '.[]' | while read -r key_json; do
    KID=$(echo "$key_json" | jq -r '.kid')
    CALLDATA=$(echo "$key_json" | jq -r '.calldata')

    echo "[$CURRENT/$KEY_COUNT] Setting key: $KID"

    output=$(sncast --profile $PROFILE --account $ACCOUNT invoke \
        --contract-address $JWKS_REGISTRY \
        --function "set_key" \
        --calldata $CALLDATA 2>&1)

    echo "$output"

    TX_HASH=$(echo "$output" | grep -o 'transaction_hash: 0x[0-9a-fA-F]*' | cut -d' ' -f2)

    if [ -n "$TX_HASH" ]; then
        echo "Transaction submitted: $TX_HASH"
        echo "Waiting for confirmation..."
        sleep 20
    else
        echo "WARNING: Could not extract transaction hash"
    fi

    echo ""
    CURRENT=$((CURRENT + 1))
done

echo "==========================================="
echo "JWKS POPULATION COMPLETE!"
echo "==========================================="
echo ""
echo "Keys have been submitted to the JWKS Registry."
echo "You can verify by calling get_key() on the registry."
echo ""
echo "View on Voyager:"
echo "  https://sepolia.voyager.online/contract/$JWKS_REGISTRY"
echo ""
