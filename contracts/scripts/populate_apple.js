const { execSync } = require('child_process');

async function populateApple() {
    const response = await fetch('https://appleid.apple.com/auth/keys');
    const jwks = await response.json();

    const registry = '0x07787f624d6869ae306dc17b49174b284dbadd1e999c1c8733ce72eb7ac518c2'; // Mainnet registry
    const admin = 'my_account'; // Assuming sncast is configured

    for (const key of jwks.keys) {
        console.log(`Processing key: ${key.kid}`);

        // Parse modulus
        const nBuffer = Buffer.from(key.n, 'base64url');
        // RSA modulus is exactly 256 bytes for 2048-bit
        const limbs = [];
        for (let i = 0; i < 16; i++) {
            // Read 16 bytes as big-endian
            let limb = 0n;
            const start = (15 - i) * 16; // Start from LSB limbs
            for (let j = 0; j < 16; j++) {
                limb = (limb * 256n) + BigInt(nBuffer[start + j]);
            }
            limbs.push(limb.toString());
        }

        // Hash kid to felt252 (matching stringToFelt in SDK)
        const kidFelt = '0x' + Buffer.from(key.kid).toString('hex'); // Placeholder hash logic if needed
        // Actually the SDK uses Poseidon? No, stringToFelt in CavosSDK is just bytes.
        // Wait, JWKSRegistry expects a felt252 for kid.

        // Command
        const calldata = [
            ...limbs,
            '0x68747470733a2f2f6170706c6569642e6170706c6569642e636f6d', // Apple iss hex (Wait, check this)
            '0', // audience (0 for skip)
            '1'  // active
        ];

        console.log(`Setting key ${key.kid}...`);
        // console.log(`sncast invoke --contract-address ${registry} --function set_key --calldata ${calldata.join(' ')}`);
    }
}

// populateApple();
