import { createHash } from 'node:crypto'
import bs58 from 'bs58'
import { Connection, PublicKey } from '@solana/web3.js'
import { hash, RpcProvider } from 'starknet'
import {
  deviceAccountProgramId,
  isSupportedSolanaNetwork,
  rpcUrl as solanaRpcUrl,
} from '@/lib/solana/relayer'

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

const SOCIAL_RECOVERY_SEED = Buffer.from('social-recovery')
const ENROLL_SELECTOR = hash.getSelectorFromName('SocialRecoveryEnrolled')
const ENROLL_DISCRIMINATOR = createHash('sha256')
  .update('global:enroll_social_recovery')
  .digest()
  .subarray(0, 8)
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
    // data[0] is recovery_id (Poseidon of x/y); the remaining fields are the
    // exact authority and policy that the enclave returned.
    if (event.data.length !== 8) return false
    return expectedData.every((expected, index) => sameInteger(event.data[index + 1], expected))
  })
}

async function verifySolanaEnrollment(proof: EnrollmentProof): Promise<boolean> {
  if (!isSupportedSolanaNetwork(proof.network)) return false
  const connection = new Connection(solanaRpcUrl(proof.network), 'confirmed')
  const transaction = await retry(() =>
    connection.getParsedTransaction(proof.txHash, {
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0,
    }),
  )
  if (!transaction || transaction.meta?.err) return false

  const programId = new PublicKey(deviceAccountProgramId())
  const wallet = new PublicKey(proof.walletAddress)
  const [recoveryConfig] = PublicKey.findProgramAddressSync(
    [SOCIAL_RECOVERY_SEED, wallet.toBuffer()],
    programId,
  )
  const recoveryKey = Buffer.from(proof.recoveryPubkeyCompressedB64, 'base64')
  const policyHash = Buffer.from(proof.policyHashHex.replace(/^0x/, '').padStart(64, '0'), 'hex')
  if (recoveryKey.length !== 33 || policyHash.length !== 32) return false
  const delay = Buffer.alloc(4)
  delay.writeUInt32LE(proof.delaySeconds)
  const expectedData = Buffer.concat([
    ENROLL_DISCRIMINATOR,
    recoveryKey,
    delay,
    policyHash,
  ])

  return transaction.transaction.message.instructions.some((instruction) => {
    if (!instruction.programId.equals(programId) || !('data' in instruction)) return false
    if (
      instruction.accounts.length < 2 ||
      !instruction.accounts[0].equals(wallet) ||
      !instruction.accounts[1].equals(recoveryConfig)
    ) {
      return false
    }
    try {
      return Buffer.from(bs58.decode(instruction.data)).equals(expectedData)
    } catch {
      return false
    }
  })
}

export async function verifyEnrollmentTransaction(proof: EnrollmentProof): Promise<boolean> {
  if (proof.network === 'sepolia' || proof.network === 'mainnet') {
    return verifyStarknetEnrollment(proof)
  }
  if (proof.network.startsWith('solana-')) {
    return verifySolanaEnrollment(proof)
  }
  return false
}
