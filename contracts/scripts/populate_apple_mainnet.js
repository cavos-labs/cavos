const { execSync } = require('child_process');

async function populateAppleMainnet() {
    const response = await fetch('https://appleid.apple.com/auth/keys');
    const jwks = await response.json();

    const registry = '0x07787f624d6869ae306dc17b49174b284dbadd1e999c1c8733ce72eb7ac518c2'; // Mainnet registry
    const issHex = '0x' + Buffer.from('https://appleid.apple.com').toString('hex');

    for (const key of jwks.keys) {
        console.log(`\nProcessing key: ${key.kid}`);

        // Parse modulus
        const nBuffer = Buffer.from(key.n, 'base64url');
        // RSA modulus is exactly 256 bytes for 2048-bit
        const limbs = [];
        for (let i = 0; i < 16; i++) {
            let limb = 0n;
            const start = (15 - i) * 16;
            for (let j = 0; j < 16; j++) {
                limb = (limb * 256n) + BigInt(nBuffer[start + j]);
            }
            limbs.push(limb.toString());
        }

        const kidFelt = '0x' + Buffer.from(key.kid).toString('hex');

        const calldata = [
            kidFelt,
            ...limbs,
            issHex,
            '0', // audience (0 for skip)
            '1'  // active
        ];

        console.log(`Executing sncast for ${key.kid}...`);
        try {
            const cmd = `sncast --profile release invoke --contract-address ${registry} --function set_key --calldata ${calldata.join(' ')}`;
            const output = execSync(cmd).toString();
            console.log(output);
        } catch (e) {
            console.error(`Failed to set key ${key.kid}:`, e.message);
        }
    }
}

populateAppleMainnet();
