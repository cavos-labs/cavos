export type SocialRecoveryProvider = 'google' | 'apple' | 'email' | 'github'
export type SocialRecoveryAction = 'enroll' | 'recover'
export type SocialRecoveryStatus =
  | 'ready'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'expired'

export interface WorkloadResult {
  result: 'enrolled' | 'recovered'
  [key: string]: unknown
}
