import { getVercelOidcToken } from '@vercel/oidc'
import { ExternalAccountClient, GoogleAuth } from 'google-auth-library'
import { gcpRecoveryConfig } from './config'

const auth = new GoogleAuth({
  scopes: ['https://www.googleapis.com/auth/cloud-platform'],
})
let vercelAuthClient: ReturnType<typeof ExternalAccountClient.fromJSON>

function requiredEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is required for Vercel-to-GCP authentication`)
  return value
}

function getVercelAuthClient(projectNumber: string) {
  if (vercelAuthClient) return vercelAuthClient

  const poolId = requiredEnv('GCP_RECOVERY_VERCEL_WIF_POOL_ID')
  const providerId = requiredEnv('GCP_RECOVERY_VERCEL_WIF_PROVIDER_ID')
  const serviceAccount = requiredEnv('GCP_RECOVERY_CONTROL_SERVICE_ACCOUNT')
  vercelAuthClient = ExternalAccountClient.fromJSON({
    type: 'external_account',
    audience: `//iam.googleapis.com/projects/${projectNumber}/locations/global/workloadIdentityPools/${poolId}/providers/${providerId}`,
    subject_token_type: 'urn:ietf:params:oauth:token-type:jwt',
    token_url: 'https://sts.googleapis.com/v1/token',
    service_account_impersonation_url: `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${serviceAccount}:generateAccessToken`,
    subject_token_supplier: {
      getSubjectToken: () => getVercelOidcToken({ expirationBufferMs: 5 * 60 * 1000 }),
    },
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  })
  if (!vercelAuthClient) {
    throw new Error('Unable to initialize Vercel workload identity credentials')
  }
  return vercelAuthClient
}

async function accessToken(projectNumber: string): Promise<string> {
  const client =
    process.env.VERCEL === '1'
      ? getVercelAuthClient(projectNumber)
      : await auth.getClient()
  const token = await client.getAccessToken()
  if (!token.token) throw new Error('Google credentials returned no access token')
  return token.token
}

export async function verifyRecoveryControlPlaneAccess(): Promise<void> {
  const cfg = gcpRecoveryConfig()
  const token = await accessToken(cfg.projectNumber)
  const response = await fetch(
    `https://compute.googleapis.com/compute/v1/projects/${encodeURIComponent(cfg.projectId)}/zones/${encodeURIComponent(cfg.zone)}/instances?maxResults=1&filter=${encodeURIComponent('labels.cavos-purpose = social-recovery')}`,
    {
      headers: { authorization: `Bearer ${token}` },
      cache: 'no-store',
    },
  )
  if (!response.ok) {
    throw new Error(
      `Compute control-plane verification failed (${response.status}): ${await response.text()}`,
    )
  }
}

export async function createRecoveryVm(params: {
  sessionId: string
  bootstrapToken: string
  instanceName: string
}): Promise<void> {
  const cfg = gcpRecoveryConfig()
  const token = await accessToken(cfg.projectNumber)
  const url = `https://compute.googleapis.com/compute/v1/projects/${encodeURIComponent(cfg.projectId)}/zones/${encodeURIComponent(cfg.zone)}/instances`
  const metadata: Array<{ key: string; value: string }> = [
    { key: 'tee-image-reference', value: cfg.workloadImage },
    { key: 'tee-restart-policy', value: 'Never' },
    { key: 'tee-container-log-redirect', value: 'false' },
    { key: 'tee-env-CAVOS_CONTROL_PLANE_URL', value: cfg.controlPlaneUrl },
    { key: 'tee-env-CAVOS_RECOVERY_SESSION_ID', value: params.sessionId },
    { key: 'tee-env-CAVOS_RECOVERY_BOOTSTRAP_TOKEN', value: params.bootstrapToken },
    { key: 'tee-env-CAVOS_ATTESTATION_AUDIENCE', value: cfg.attestationAudience },
    { key: 'tee-env-CAVOS_KMS_KEY_NAME', value: cfg.kmsKeyName },
    { key: 'tee-env-CAVOS_WIF_AUDIENCE', value: cfg.wifAudience },
  ]
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      name: params.instanceName,
      machineType: `zones/${cfg.zone}/machineTypes/${cfg.machineType}`,
      confidentialInstanceConfig: {
        enableConfidentialCompute: true,
        confidentialInstanceType: 'SEV',
      },
      scheduling: {
        automaticRestart: false,
        onHostMaintenance: 'MIGRATE',
        provisioningModel: 'STANDARD',
      },
      shieldedInstanceConfig: {
        enableSecureBoot: true,
        enableVtpm: true,
        enableIntegrityMonitoring: true,
      },
      disks: [
        {
          boot: true,
          autoDelete: true,
          type: 'PERSISTENT',
          initializeParams: {
            sourceImage:
              'projects/confidential-space-images/global/images/family/confidential-space',
            diskSizeGb: '11',
            diskType: `zones/${cfg.zone}/diskTypes/pd-balanced`,
          },
        },
      ],
      networkInterfaces: [
        {
          network: 'global/networks/default',
          accessConfigs: [{ name: 'External NAT', type: 'ONE_TO_ONE_NAT' }],
        },
      ],
      serviceAccounts: [
        {
          email: cfg.workloadServiceAccount,
          scopes: ['https://www.googleapis.com/auth/cloud-platform'],
        },
      ],
      metadata: { items: metadata },
      labels: {
        'cavos-purpose': 'social-recovery',
        'cavos-session': params.sessionId.replaceAll('-', '').slice(0, 32),
      },
      deletionProtection: false,
    }),
  })
  if (!response.ok) {
    throw new Error(`Compute instance create failed (${response.status}): ${await response.text()}`)
  }
}

export async function getRecoveryVm(instanceName: string): Promise<{
  id: string
  status: string
}> {
  const cfg = gcpRecoveryConfig()
  const token = await accessToken(cfg.projectNumber)
  const response = await fetch(
    `https://compute.googleapis.com/compute/v1/projects/${encodeURIComponent(cfg.projectId)}/zones/${encodeURIComponent(cfg.zone)}/instances/${encodeURIComponent(instanceName)}`,
    { headers: { authorization: `Bearer ${token}` } },
  )
  if (!response.ok) {
    throw new Error(`Compute instance get failed (${response.status})`)
  }
  const instance = (await response.json()) as { id: string; status: string }
  return { id: String(instance.id), status: instance.status }
}

export async function deleteRecoveryVm(instanceName: string): Promise<void> {
  const cfg = gcpRecoveryConfig()
  const token = await accessToken(cfg.projectNumber)
  const response = await fetch(
    `https://compute.googleapis.com/compute/v1/projects/${encodeURIComponent(cfg.projectId)}/zones/${encodeURIComponent(cfg.zone)}/instances/${encodeURIComponent(instanceName)}`,
    {
      method: 'DELETE',
      headers: { authorization: `Bearer ${token}` },
    },
  )
  if (!response.ok && response.status !== 404) {
    throw new Error(`Compute instance delete failed (${response.status}): ${await response.text()}`)
  }
}
