/**
 * Katana bootstrap — make a fresh Katana ready to run Cavos accounts.
 *
 * Onboarding a new Katana used to be a manual multi-step chore. Worse, on Katanas
 * where `dev_setStorageAt` is a no-op, the old parity script could never hand the
 * registry admin to a shared operator, so JWKS keys never loaded and every login
 * failed with "JWKS key invalid or expired".
 *
 * This module does the whole thing idempotently and without any dev RPC:
 *   1. Declare the OZ account class on the target Katana (sierra+casm fetched
 *      read-only from a source chain, e.g. Sepolia).
 *   2. Counterfactually deploy the two Cavos registry-admin accounts at their
 *      exact parity addresses (same class+salt+pubkey => same address). Their
 *      private keys live only in server-side env.
 *   3. Deploy the parity JWKS registries via UDC if missing.
 *   4. Load Google/Apple/Cavos JWKS into each registry, signing as its real admin.
 *
 * All writes go to the target Katana only. The source chain is read-only.
 */

import { Account, CallData, RpcProvider, byteArray, hash } from 'starknet';

// ── Constants (all public) ───────────────────────────────────────────────────

const OZ_CLASS_HASH =
  '0x5b4b537eaa2399e3aa99c4e2e0208ebd6c71bc1467938cd52c798c601e43564';
const REGISTRY_CLASS_HASH =
  '0x9ae56da2c3750d4e0bdcd2f2a17a49ccac738e14933fae1bcc4c5ac8b4ee3';
const UDC_ADDRESS =
  '0x041a78e741e5af2fec34b695679bc6891742439f7afb8484ecd7766661ad02bf';

const DEFAULT_SOURCE_RPC =
  process.env.KATANA_BOOTSTRAP_SOURCE_RPC ||
  'https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_10/2qi3kpZwfw6DlnjQmzL8vUh5PlqZ0Dpv';

const ISS_MAP = {
  google: '0x' + Buffer.from('https://accounts.google.com').toString('hex'),
  apple: '0x' + Buffer.from('https://appleid.apple.com').toString('hex'),
  cavos: '0x' + Buffer.from('https://cavos.app/firebase').toString('hex'),
};

interface AdminAccount {
  address: string;
  privateKey: string;
  publicKey: string;
  salt: string;
}

interface RegistryTarget {
  net: 'sepolia' | 'mainnet';
  registry: string;
  salt: string;
  admin: AdminAccount;
}

/**
 * Public parity data + admin creds (private keys pulled from env secrets).
 * Public keys and salts are fixed by the accounts that originally deployed the
 * canonical registries; they never change.
 */
function getRegistryTargets(): RegistryTarget[] {
  const sepAddr = process.env.JWKS_ADMIN_ADDRESS_SEPOLIA;
  const sepPk = process.env.JWKS_ADMIN_PRIVATE_KEY_SEPOLIA;
  const mainAddr = process.env.JWKS_ADMIN_ADDRESS_MAINNET;
  const mainPk = process.env.JWKS_ADMIN_PRIVATE_KEY_MAINNET;
  if (!sepAddr || !sepPk || !mainAddr || !mainPk) {
    throw new Error(
      'Missing admin secrets: set JWKS_ADMIN_ADDRESS_SEPOLIA/MAINNET and JWKS_ADMIN_PRIVATE_KEY_SEPOLIA/MAINNET.'
    );
  }
  return [
    {
      net: 'sepolia',
      registry:
        '0x0112c6a8a69e4d9a2e74b4638e1495d69266de9f6f796727d4a52a7ab0a48db2',
      salt: '0xf293006a47eff8c7',
      admin: {
        address: sepAddr,
        privateKey: sepPk,
        publicKey:
          '0x456bf5de59d6e610b50321fb966ef9d1a30397ff76104f0f64ea50ebdd88be1',
        salt: '0x1136c828bd89435d',
      },
    },
    {
      net: 'mainnet',
      registry:
        '0x076ff6853197538b4d4c925b2c775014fae9b5c14f63262b13f2e49f732e21f7',
      salt: '0x6c3971b52b2bfc0a',
      admin: {
        address: mainAddr,
        privateKey: mainPk,
        publicKey:
          '0x5e398c5e6b3ddfc4719178f93bf29e613172a2b61cf83d41eb92333dc81149c',
        salt: '0x87f1169fe3dbaaf9',
      },
    },
  ];
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface BootstrapInput {
  /** RPC URL of the target Katana. */
  rpcUrl: string;
  /** A funded/deployed account on the target Katana used to declare classes and
   *  deploy registries (fees are free on Katana; only needed as a live sender). */
  operatorAddress: string;
  operatorPrivateKey: string;
  /** Source chain RPC to read the OZ class from. Defaults to Sepolia. */
  sourceRpcUrl?: string;
}

export interface RegistryResult {
  net: string;
  registry: string;
  admin: string;
  adminDeployed: 'existing' | 'deployed';
  registryDeployed: 'existing' | 'deployed';
  keysLoaded: number;
  verified: { google: boolean; apple: boolean; cavos: boolean };
}

export interface BootstrapResult {
  rpcUrl: string;
  chainId: string;
  ozClass: 'existing' | 'declared';
  registries: RegistryResult[];
}

// ── Main ─────────────────────────────────────────────────────────────────────

export async function bootstrapKatana(input: BootstrapInput): Promise<BootstrapResult> {
  const targets = getRegistryTargets();
  const katana = new RpcProvider({ nodeUrl: input.rpcUrl });
  const sourceUrl = input.sourceRpcUrl || DEFAULT_SOURCE_RPC;
  const source = new RpcProvider({ nodeUrl: sourceUrl });
  const chainId = await katana.getChainId();

  const operator = new Account({
    provider: katana,
    address: input.operatorAddress,
    signer: input.operatorPrivateKey,
  });

  // 1. Declare OZ account class on the Katana (from source chain read).
  const ozClass = await ensureOzClassDeclared(katana, source, sourceUrl, operator);

  // 2. Deploy the admin accounts at their exact addresses.
  const adminStatus: Record<string, 'existing' | 'deployed'> = {};
  for (const { admin } of targets) {
    adminStatus[admin.address] = await ensureAdminDeployed(katana, admin);
  }

  // 3. Deploy any missing parity registry.
  const registryStatus: Record<string, 'existing' | 'deployed'> = {};
  for (const t of targets) {
    registryStatus[t.registry] = await ensureRegistryDeployed(katana, operator, t);
  }

  // 4. Fetch keys once and populate each registry as its admin.
  const google = await fetchJWKS('https://www.googleapis.com/oauth2/v3/certs');
  const apple = await fetchJWKS('https://appleid.apple.com/auth/keys');
  const cavos = await fetchJWKS('https://cavos.xyz/.well-known/jwks.json');

  const registries: RegistryResult[] = [];
  for (const t of targets) {
    const acct = new Account({
      provider: katana,
      address: t.admin.address,
      signer: t.admin.privateKey,
    });
    const calls = [
      ...google.map((k) => keyCall(t.registry, k, ISS_MAP.google)),
      ...apple.map((k) => keyCall(t.registry, k, ISS_MAP.apple)),
      ...cavos.map((k) => keyCall(t.registry, k, ISS_MAP.cavos)),
    ];
    const tx = await acct.execute(calls);
    await katana.waitForTransaction(tx.transaction_hash);

    registries.push({
      net: t.net,
      registry: t.registry,
      admin: t.admin.address,
      adminDeployed: adminStatus[t.admin.address],
      registryDeployed: registryStatus[t.registry],
      keysLoaded: calls.length,
      verified: {
        google: await verifyKid(katana, t.registry, google[0]?.kid),
        apple: await verifyKid(katana, t.registry, apple[0]?.kid),
        cavos: await verifyKid(katana, t.registry, cavos[0]?.kid),
      },
    });
  }

  return { rpcUrl: input.rpcUrl, chainId, ozClass, registries };
}

// ── Steps ────────────────────────────────────────────────────────────────────

async function ensureOzClassDeclared(
  katana: RpcProvider,
  source: RpcProvider,
  sourceUrl: string,
  operator: Account
): Promise<'existing' | 'declared'> {
  try {
    await katana.getClass(OZ_CLASS_HASH);
    return 'existing';
  } catch {
    // not declared yet
  }
  const contract = await source.getClass(OZ_CLASS_HASH);
  const casm = await fetchCompiledCasm(sourceUrl, OZ_CLASS_HASH);
  const compiledClassHash = hash.computeCompiledClassHash(casm as any);
  const res = await operator.declare({ contract: contract as any, casm: casm as any, compiledClassHash });
  await katana.waitForTransaction(res.transaction_hash);
  return 'declared';
}

async function ensureAdminDeployed(
  katana: RpcProvider,
  admin: AdminAccount
): Promise<'existing' | 'deployed'> {
  try {
    await katana.getClassHashAt(admin.address);
    return 'existing';
  } catch {
    // not deployed yet
  }
  const acct = new Account({ provider: katana, address: admin.address, signer: admin.privateKey });
  const { transaction_hash, contract_address } = await acct.deployAccount({
    classHash: OZ_CLASS_HASH,
    constructorCalldata: CallData.compile({ publicKey: admin.publicKey }),
    addressSalt: admin.salt,
    contractAddress: admin.address,
  });
  await katana.waitForTransaction(transaction_hash);
  if (normalize(contract_address) !== normalize(admin.address)) {
    throw new Error(`Admin deployed to wrong address: ${contract_address} != ${admin.address}`);
  }
  return 'deployed';
}

async function ensureRegistryDeployed(
  katana: RpcProvider,
  operator: Account,
  t: RegistryTarget
): Promise<'existing' | 'deployed'> {
  try {
    await katana.getClassHashAt(t.registry);
    return 'existing';
  } catch {
    // not deployed yet
  }
  const ctorArgs = CallData.compile({ admin: t.admin.address });
  const tx = await operator.execute({
    contractAddress: UDC_ADDRESS,
    entrypoint: 'deployContract',
    calldata: [REGISTRY_CLASS_HASH, t.salt, '0x0', ctorArgs.length, ...ctorArgs],
  });
  await katana.waitForTransaction(tx.transaction_hash);
  const got = await katana.getClassHashAt(t.registry);
  if (normalize(got) !== normalize(REGISTRY_CLASS_HASH)) {
    throw new Error(`${t.net} registry deployed with unexpected class ${got}`);
  }
  return 'deployed';
}

// ── Helpers ──────────────────────────────────────────────────────────────────

interface JWK { kid: string; n: string; alg: string; kty: string }

function keyCall(registry: string, k: JWK, iss: string) {
  return {
    contractAddress: registry,
    entrypoint: 'set_key',
    calldata: [computeKidFelt(k.kid), ...modulusToU96Limbs(k.n), iss, '0', '1'],
  };
}

function computeKidFelt(kid: string): string {
  return hash.computePoseidonHashOnElements(CallData.compile(byteArray.byteArrayFromString(kid)));
}

function modulusToU96Limbs(base64urlN: string): string[] {
  const nBytes = Buffer.from(base64urlN.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
  const padded = Buffer.alloc(288, 0);
  nBytes.copy(padded, 288 - nBytes.length);
  const limbs: string[] = [];
  for (let i = 23; i >= 0; i--) {
    let limb = 0n;
    for (let j = 0; j < 12; j++) limb = (limb << 8n) | BigInt(padded[i * 12 + j]);
    limbs.push('0x' + limb.toString(16));
  }
  return limbs;
}

async function verifyKid(katana: RpcProvider, registry: string, kid?: string): Promise<boolean> {
  if (!kid) return false;
  try {
    const res = await katana.callContract({
      contractAddress: registry,
      entrypoint: 'get_key_if_valid',
      calldata: [computeKidFelt(kid)],
    });
    return Array.isArray(res) && res.some((v) => normalize(v) !== '0x0');
  } catch {
    return false;
  }
}

async function fetchJWKS(url: string): Promise<JWK[]> {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`JWKS fetch failed (${r.status}) for ${url}`);
  const payload = await r.json();
  return (payload.keys || []).filter((k: JWK) => k.kty === 'RSA' && k.alg === 'RS256');
}

async function fetchCompiledCasm(rpcUrl: string, classHash: string) {
  const res = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'starknet_getCompiledCasm', params: [classHash] }),
  });
  const data = await res.json();
  if (data.error) throw new Error('getCompiledCasm: ' + JSON.stringify(data.error));
  return data.result;
}

function normalize(v: string | bigint): string {
  return '0x' + BigInt(v).toString(16);
}
