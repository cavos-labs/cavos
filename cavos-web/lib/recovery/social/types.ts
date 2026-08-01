export type SocialRecoveryProvider = 'google' | 'apple' | 'email'
export type SocialRecoveryAction = 'enroll' | 'recover'
export type SocialRecoveryStatus =
  | 'starting'
  | 'ready'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'expired'

export interface AttestationClaims {
  sub: string
  swname: string
  dbgstat: string
  google_service_accounts: string[]
  eat_nonce?: string | string[]
  submods: {
    confidential_space?: { support_attributes?: string[] }
    container?: { image_digest?: string }
    gce?: {
      project_number?: string
      instance_id?: string
      instance_name?: string
      zone?: string
    }
  }
}

export interface WorkloadResult {
  result: 'enrolled' | 'recovered'
  [key: string]: unknown
}
