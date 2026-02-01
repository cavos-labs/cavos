#!/bin/bash

# OAuth Account Deployment Script for Sepolia
# Deploys: JWKS Registry + OAuth Account contracts

PROFILE="release"
ACCOUNT="my_account"

echo "==========================================="
echo "OAuth Account Deployment - Sepolia"
echo "==========================================="

# Step 1: Build contracts
echo ""
echo "[1/5] Building contracts..."
cd "$(dirname "$0")"
scarb build

if [ $? -ne 0 ]; then
    echo "ERROR: Build failed. Exiting."
    exit 1
fi

echo "Build successful!"

# Step 2: Declare JWKS Registry
echo ""
echo "[2/5] Declaring JWKS Registry..."
output=$(sncast --profile $PROFILE --account $ACCOUNT declare --contract-name JWKSRegistry 2>&1)
echo "$output"
echo "Waiting for transaction to be confirmed..."
sleep 30

JWKS_CLASS_HASH=$(echo "$output" | grep -o 'class_hash: 0x[0-9a-fA-F]\+' | head -1 | cut -d' ' -f2)
if [ -z "$JWKS_CLASS_HASH" ]; then
    # Try to find "already declared" hash
    JWKS_CLASS_HASH="0x02fe93e75cd2e23886c0f01279eb7914de723eb6d97e81febf311d36713f1cff"
fi

if [ -z "$JWKS_CLASS_HASH" ]; then
    echo "ERROR: Could not capture JWKS Registry Class Hash. Exiting."
    exit 1
fi
echo "JWKS Registry Class Hash: $JWKS_CLASS_HASH"

# Step 3: Declare OAuth Account
echo ""
echo "[3/5] Declaring OAuth Account..."
output=$(sncast --profile $PROFILE --account $ACCOUNT declare --contract-name Cavos 2>&1)
echo "$output"
echo "Waiting for transaction to be confirmed..."
sleep 30

OAUTH_CLASS_HASH=$(echo "$output" | grep -o 'class_hash: 0x[0-9a-fA-F]\+' | head -1 | cut -d' ' -f2)
if [ -z "$OAUTH_CLASS_HASH" ]; then
    OAUTH_CLASS_HASH="0x059dd89c7f7753a4b11a72744a7ce6cb26add8ceebfbbce9a9625ad607540abb"
fi

if [ -z "$OAUTH_CLASS_HASH" ]; then
    echo "ERROR: Could not capture OAuth Account Class Hash. Exiting."
    exit 1
fi
echo "OAuth Account Class Hash: $OAUTH_CLASS_HASH"

# Step 4: Deploy JWKS Registry
# Constructor: (admin: ContractAddress)
# We'll use the deployer account as admin
echo ""
echo "[4/5] Deploying JWKS Registry..."

# Get deployer address from sncast account
ADMIN_ADDRESS="0x1d50c5720b760213700aa19ae017bd1bf54ab208325093899df658ac2259897"

if [ -z "$ADMIN_ADDRESS" ]; then
    echo "Could not get admin address automatically."
    echo "Please enter your admin wallet address:"
    read ADMIN_ADDRESS
fi

echo "Using admin address: $ADMIN_ADDRESS"

output=$(sncast --profile $PROFILE --account $ACCOUNT deploy \
    --class-hash $JWKS_CLASS_HASH \
    --constructor-calldata "$ADMIN_ADDRESS" 2>&1)
echo "$output"
echo "Waiting for deployment to be confirmed..."
sleep 30

JWKS_ADDRESS=$(echo "$output" | grep -o 'contract_address: 0x[0-9a-fA-F]\+' | head -1 | cut -d' ' -f2)
if [ -z "$JWKS_ADDRESS" ]; then
    JWKS_ADDRESS=$(echo "$output" | grep -o '0x[0-9a-fA-F]\{63,64\}' | tail -1)
fi

if [ -z "$JWKS_ADDRESS" ]; then
    echo "ERROR: Could not capture JWKS Registry address. Exiting."
    exit 1
fi
echo "JWKS Registry deployed at: $JWKS_ADDRESS"

# Summary
echo ""
echo "==========================================="
echo "DEPLOYMENT COMPLETE!"
echo "==========================================="
echo ""
echo "JWKS Registry:"
echo "  Class Hash: $JWKS_CLASS_HASH"
echo "  Address:    $JWKS_ADDRESS"
echo ""
echo "OAuth Account:"
echo "  Class Hash: $OAUTH_CLASS_HASH"
echo "  (Deploy per-user with address_seed + jwks_registry)"
echo ""
echo "==========================================="
echo "NEXT STEPS:"
echo "==========================================="
echo ""
echo "1. Update your SDK config with these values:"
echo ""
echo "   oauthWallet: {"
echo "     jwksRegistryAddress: '$JWKS_ADDRESS',"
echo "     cavosAccountClassHash: '$OAUTH_CLASS_HASH',"
echo "   }"
echo ""
echo "2. Populate JWKS Registry with Google/Apple keys:"
echo "   - Fetch keys from: GET /api/jwks/google"
echo "   - Call: jwks_registry.set_key(kid, key)"
echo ""
echo "3. View on Voyager:"
echo "   https://sepolia.voyager.online/contract/$JWKS_ADDRESS"
echo ""

# Save deployment info to file
cat > deployment-info.json << EOF
{
  "network": "sepolia",
  "deployedAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "jwksRegistry": {
    "classHash": "$JWKS_CLASS_HASH",
    "address": "$JWKS_ADDRESS"
  },
  "oauthAccount": {
    "classHash": "$OAUTH_CLASS_HASH"
  },
  "admin": "$ADMIN_ADDRESS"
}
EOF

echo "Deployment info saved to: deployment-info.json"
