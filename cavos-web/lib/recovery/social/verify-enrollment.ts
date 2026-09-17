import { hash, RpcProvider } from 'starknet'

interface EnrollmentProof {
  txHash: string
  network: string
  walletAddress: string
  recoveryPubkeyCompressedB64: string
  recoveryXHex: string
  recoveryYHex: string
  delaySeconds: number
  policyHashHex: string
}

const ENROLL_SELECTOR = hash.getSelectorFromName('SocialRecoveryEnrolled')
const U128_MASK = (1n << 128n) - 1n

function sameInteger(left: string, right: bigint | string): boolean {
  try {
    return BigInt(left) === BigInt(right)
  } catch {
    return false
  }
}

function starknetRpcUrl(network: string): string {
  if (network === 'sepolia') {
    return (
      process.env.STARKNET_RPC_SEPOLIA ||
      process.env.STARKNET_SEPOLIA_RPC_URL ||
      process.env.STARKNET_RPC_URL ||
      'https://api.cartridge.gg/x/starknet/sepolia'
    )
  }
  if (network === 'mainnet') {
    return (
      process.env.STARKNET_RPC_MAINNET ||
      process.env.STARKNET_MAINNET_RPC_URL ||
      process.env.STARKNET_RPC_URL ||
      'https://api.cartridge.gg/x/starknet/mainnet'
    )
  }
  throw new Error(`unsupported Starknet network: ${network}`)
}

async function retry<T>(operation: () => Promise<T | null>): Promise<T | null> {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    try {
      const value = await operation()
      if (value !== null) return value
    } catch {
      // RPCs can briefly return transaction-not-found immediately after the
      // wallet submission. Retry within this request; never accept on error.
    }
    if (attempt < 7) {
      await new Promise((resolve) => setTimeout(resolve, 1_500))
    }
  }
  return null
}

async function verifyStarknetEnrollment(proof: EnrollmentProof): Promise<boolean> {
  const provider = new RpcProvider({ nodeUrl: starknetRpcUrl(proof.network) })
  const receipt = await retry(async () => {
    const candidate = await provider.getTransactionReceipt(proof.txHash)
    return candidate.isSuccess() ? candidate : null
  })
  if (!receipt) return false

  const recoveryX = BigInt(proof.recoveryXHex)
  const recoveryY = BigInt(proof.recoveryYHex)
  const policyHash = BigInt(proof.policyHashHex)
  const expectedData = [
    recoveryX & U128_MASK,
    recoveryX >> 128n,
    recoveryY & U128_MASK,
    recoveryY >> 128n,
    BigInt(proof.delaySeconds),
    policyHash & U128_MASK,
    policyHash >> 128n,
  ]

  return receipt.events.some((event) => {
    if (!sameInteger(event.from_address, proof.walletAddress)) return false
    if (!event.keys.some((key) => sameInteger(key, ENROLL_SELECTOR))) return false
    if (event.data.length !== 8) return false
    return expectedData.every((expected, index) => sameInteger(event.data[index + 1], expected))
  })
}

export async function verifyEnrollmentTransaction(proof: EnrollmentProof): Promise<boolean> {
  if (proof.network === 'sepolia' || proof.network === 'mainnet') {
    return verifyStarknetEnrollment(proof)
  }
  // Native Solana/Stellar enroll the DEK at connect; there is no on-chain
  // enroll_social_recovery transaction to verify.
  return false
}
