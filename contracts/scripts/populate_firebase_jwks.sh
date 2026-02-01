#!/bin/bash

# Firebase JWKS Registration Script
# Fetches Firebase RSA key and registers it in the on-chain JWKS Registry

PROFILE="release"
ACCOUNT="my_account"
JWKS_REGISTRY="0x07787f624d6869ae306dc17b49174b284dbadd1e999c1c8733ce72eb7ac518c2"
BACKEND_URL="https://cavos.xyz"
echo "==========================================="
echo "Firebase JWKS Registration - Sepolia"
echo "==========================================="
echo ""
echo "Registry address: $JWKS_REGISTRY"
echo "Backend URL:      $BACKEND_URL"
echo ""

# Fetch Firebase JWKS in contract format
echo "[1/3] Fetching Firebase JWKS from backend..."
FIREBASE_RESPONSE=$(curl -s "$BACKEND_URL/api/jwks/firebase")

if [ -z "$FIREBASE_RESPONSE" ]; then
    echo "ERROR: Failed to fetch Firebase JWKS from $BACKEND_URL/api/jwks/firebase"
    echo "Make sure the backend is running and the endpoint is accessible."
    exit 1
fi

echo "Firebase JWKS fetched successfully"
echo ""

# Parse contract format from response
echo "[2/3] Parsing contract format..."

# Create a temporary Node.js script to extract contract format
cat > /tmp/format_firebase_jwks.js << 'NODEJS_SCRIPT'
const response = JSON.parse(process.argv[2]);

if (!response.contract) {
  console.error('ERROR: No contract format found in response');
  process.exit(1);
}

const contract = response.contract;

function kidToFelt(kid) {
  const bytes = Buffer.from(kid, 'utf8');
  let felt = 0n;
  for (let i = 0; i < bytes.length && i < 31; i++) {
    felt = felt * 256n + BigInt(bytes[i]);
  }
  return '0x' + felt.toString(16);
}

const FIREBASE_PROVIDER = '0x6669726562617365'; // 'firebase' as felt252
const VALID_UNTIL = Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60); // 1 year from now
const IS_ACTIVE = '1';

const kidFelt = kidToFelt(contract.kid);

// Normalize modulus limbs to ensure they're hex strings
const modulusLimbs = contract.modulus_limbs.map(limb => {
  if (typeof limb === 'string' && limb.startsWith('0x')) {
    return limb;
  }
  return '0x' + BigInt(limb).toString(16);
});

// Format calldata for set_key(kid, JWKSKey)
// JWKSKey struct: n0-n15 (16 u128), provider (felt252), valid_until (u64), is_active (bool)
const calldata = [
  kidFelt,              // kid
  ...modulusLimbs,      // n0-n15 (16 limbs)
  FIREBASE_PROVIDER,    // provider
  VALID_UNTIL,          // valid_until
  IS_ACTIVE             // is_active
];

const result = {
  kid: contract.kid,
  kidFelt,
  provider: 'firebase',
  validUntil: VALID_UNTIL,
  calldata: calldata.join(' ')
};

console.log(JSON.stringify(result, null, 2));
NODEJS_SCRIPT

FORMATTED_KEY=$(node /tmp/format_firebase_jwks.js "$FIREBASE_RESPONSE")

if [ -z "$FORMATTED_KEY" ]; then
    echo "ERROR: Failed to format Firebase key"
    rm /tmp/format_firebase_jwks.js
    exit 1
fi

echo "Formatted Firebase key:"
echo "$FORMATTED_KEY" | jq
echo ""

# Submit key to JWKS Registry
echo "[3/3] Submitting Firebase key to JWKS Registry..."
echo ""

KID=$(echo "$FORMATTED_KEY" | jq -r '.kid')
CALLDATA=$(echo "$FORMATTED_KEY" | jq -r '.calldata')

echo "Setting key: $KID"
echo ""

output=$(sncast --profile $PROFILE --account $ACCOUNT invoke \
    --contract-address $JWKS_REGISTRY \
    --function "set_key" \
    --calldata $CALLDATA 2>&1)

echo "$output"

TX_HASH=$(echo "$output" | grep -o 'transaction_hash: 0x[0-9a-fA-F]*' | cut -d' ' -f2)

if [ -n "$TX_HASH" ]; then
    echo ""
    echo "Transaction submitted: $TX_HASH"
    echo "Waiting for confirmation..."
    sleep 30
    echo ""
else
    echo "WARNING: Could not extract transaction hash"
    echo "The transaction may have failed or the output format changed."
    echo ""
fi

# Clean up
rm /tmp/format_firebase_jwks.js

echo "==========================================="
echo "FIREBASE JWKS REGISTRATION COMPLETE!"
echo "==========================================="
echo ""
echo "Firebase key has been submitted to the JWKS Registry."
echo "KID: $KID"
echo "You can verify by calling get_key on the registry."
echo ""
echo "View on Voyager:"
echo "  https://sepolia.voyager.online/contract/$JWKS_REGISTRY"
echo ""
echo "Next steps:"
echo "  1. Try logging in with Firebase email/password in your app"
echo "  2. The contract should now accept Firebase JWTs for authentication"
echo ""
