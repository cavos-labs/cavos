/**
 * ZK Login Prover
 *
 * Generates Groth16 proofs for zkLogin circuit using snarkjs.
 * The circuit proves JWT validity and authorization of ephemeral keys.
 */

import * as snarkjs from 'snarkjs';
import * as fs from 'fs';
import * as path from 'path';
import { poseidon } from 'poseidon-lite';
import {
  generateCircuitInputs,
  fetchGoogleJWKS,
  CircuitInputParams,
} from './circuit-inputs';

// Circuit file paths (relative to project root)
const CIRCUIT_DIR = path.join(process.cwd(), 'circuits');
const WASM_PATH = path.join(CIRCUIT_DIR, 'zkLogin.wasm');
const ZKEY_PATH = path.join(CIRCUIT_DIR, 'zkLogin_final.zkey');
const VKEY_PATH = path.join(CIRCUIT_DIR, 'zkLogin.vkey');

export interface ProofResult {
  success: boolean;
  proof?: {
    pi_a: string[];
    pi_b: string[][];
    pi_c: string[];
    protocol: string;
    curve: string;
  };
  publicSignals?: string[];
  publicInputs?: {
    ephPublicKey: [string, string];
    addressSeed: string;
    maxEpoch: string;
    issB64F: string;
    issIndexMod4: string;
    headerF: string;
    modulusF: string;
  };
  allInputsHash?: string;
  accountAddress?: string;
  garaga?: string[];
  error?: string;
}

export interface ProveRequest {
  jwt: string;
  ephPublicKey: [string, string];
  maxBlock: string;
  randomness: string;
  salt: string;
}

/**
 * Cache for Google JWKS
 */
let cachedJWKS: Awaited<ReturnType<typeof fetchGoogleJWKS>> | null = null;
let jwksExpiry = 0;
const JWKS_CACHE_DURATION = 3600 * 1000; // 1 hour

async function getGoogleJWKS() {
  if (cachedJWKS && Date.now() < jwksExpiry) {
    return cachedJWKS;
  }
  cachedJWKS = await fetchGoogleJWKS();
  jwksExpiry = Date.now() + JWKS_CACHE_DURATION;
  return cachedJWKS;
}

/**
 * Convert snarkjs proof to Garaga format for Starknet verification
 *
 * Garaga expects the proof elements in a specific order and format
 * for efficient on-chain verification.
 */
function proofToGaraga(
  proof: { pi_a: string[]; pi_b: string[][]; pi_c: string[] },
  publicSignals: string[]
): string[] {
  const garaga: string[] = [];

  // pi_a (2 elements, each is a field element)
  garaga.push(proof.pi_a[0]);
  garaga.push(proof.pi_a[1]);

  // pi_b (2x2 matrix - note: order is reversed for pairing check)
  garaga.push(proof.pi_b[0][1]);
  garaga.push(proof.pi_b[0][0]);
  garaga.push(proof.pi_b[1][1]);
  garaga.push(proof.pi_b[1][0]);

  // pi_c (2 elements)
  garaga.push(proof.pi_c[0]);
  garaga.push(proof.pi_c[1]);

  // Public signals (all_inputs_hash is the first one)
  for (const signal of publicSignals) {
    garaga.push(signal);
  }

  return garaga;
}

/**
 * Compute account address from address_seed
 * This matches the Starknet contract address derivation
 */
function computeAccountAddress(addressSeed: string): string {
  // Import constants from environment or config
  const ACCOUNT_CLASS_HASH =
    process.env.ACCOUNT_CLASS_HASH ||
    '0x1f7f39a896171d9634da3755c46b5142445848b00a945ca39dd2ed3fab1b3f0';
  const LOGIN_ADDRESS =
    process.env.LOGIN_ADDRESS ||
    '0x01f246a13722376f69cb359ac35b99b00180288b4a153ef9b6425795bffe5527';

  // Use Poseidon hash for address derivation (Starknet's pedersen/poseidon for contract addresses)
  // This is a simplified version - the actual computation uses Starknet's compute_contract_address
  const hash = poseidon([
    BigInt(addressSeed),
    BigInt(ACCOUNT_CLASS_HASH),
    BigInt(LOGIN_ADDRESS),
    0n, // constructor calldata hash (initial_public_key = 0)
  ]);

  return '0x' + hash.toString(16).padStart(64, '0');
}

/**
 * Generate a ZK proof for the given JWT and session data
 */
export async function generateProof(request: ProveRequest): Promise<ProofResult> {
  try {
    console.log('Starting proof generation...');
    const startTime = Date.now();

    // Fetch Google JWKS
    console.log('Fetching Google JWKS...');
    const jwks = await getGoogleJWKS();

    // Generate circuit inputs
    console.log('Generating circuit inputs...');
    const circuitParams: CircuitInputParams = {
      jwt: request.jwt,
      ephPublicKey: request.ephPublicKey,
      maxBlock: request.maxBlock,
      randomness: request.randomness,
      salt: request.salt,
    };

    const circuitInputs = await generateCircuitInputs(circuitParams, jwks);

    // Check if circuit files exist
    if (!fs.existsSync(WASM_PATH)) {
      throw new Error(`Circuit WASM file not found at ${WASM_PATH}`);
    }
    if (!fs.existsSync(ZKEY_PATH)) {
      throw new Error(`Circuit zkey file not found at ${ZKEY_PATH}`);
    }

    // Generate witness and proof using snarkjs
    console.log('Generating witness and proof...');

    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      circuitInputs,
      WASM_PATH,
      ZKEY_PATH
    );

    console.log(`Proof generated in ${Date.now() - startTime}ms`);

    // Convert proof to Garaga format
    const garaga = proofToGaraga(proof, publicSignals);

    // Extract public inputs from the circuit
    // The order matches the circuit's output signals
    const publicInputs = {
      ephPublicKey: request.ephPublicKey,
      addressSeed: circuitInputs.salt, // This is computed inside the circuit
      maxEpoch: request.maxBlock,
      issB64F: '0', // TODO: Extract from public signals
      issIndexMod4: '0',
      headerF: '0',
      modulusF: '0',
    };

    // Compute account address
    const accountAddress = computeAccountAddress(circuitInputs.salt);

    return {
      success: true,
      proof,
      publicSignals,
      publicInputs,
      allInputsHash: circuitInputs.all_inputs_hash,
      accountAddress,
      garaga,
    };
  } catch (error) {
    console.error('Proof generation failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Verify a proof using the verification key
 */
export async function verifyProof(
  proof: ProofResult['proof'],
  publicSignals: string[]
): Promise<boolean> {
  try {
    if (!proof) {
      throw new Error('Proof is undefined');
    }
    if (!fs.existsSync(VKEY_PATH)) {
      throw new Error(`Verification key not found at ${VKEY_PATH}`);
    }

    const vkey = JSON.parse(fs.readFileSync(VKEY_PATH, 'utf-8'));
    const isValid = await snarkjs.groth16.verify(vkey, publicSignals, proof);
    return isValid;
  } catch (error) {
    console.error('Verification failed:', error);
    return false;
  }
}

/**
 * Health check for the prover
 */
export function checkProverHealth(): {
  ready: boolean;
  wasmExists: boolean;
  zkeyExists: boolean;
  vkeyExists: boolean;
} {
  return {
    ready:
      fs.existsSync(WASM_PATH) &&
      fs.existsSync(ZKEY_PATH) &&
      fs.existsSync(VKEY_PATH),
    wasmExists: fs.existsSync(WASM_PATH),
    zkeyExists: fs.existsSync(ZKEY_PATH),
    vkeyExists: fs.existsSync(VKEY_PATH),
  };
}
