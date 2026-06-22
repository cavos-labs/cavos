export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      // ── Billing ───────────────────────────────────────────────────────────
      // Per-org subscription state (plan_tier, Onvo linkage, custom contract).
      // plan_tier is the single source of truth for the wallet-count gate.
      org_subscriptions: {
        Row: {
          org_id: string
          plan_tier: string                   // 'free' | 'pro' | 'custom'
          status: string                      // 'active' | 'past_due' | 'canceled'
          onvo_customer_id: string | null
          onvo_subscription_id: string | null
          current_period_end: string | null
          cancel_at_period_end: boolean
          custom_wallet_limit: number | null  // null = unlimited
          custom_contract_ref: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          org_id: string
          plan_tier?: string
          status?: string
          onvo_customer_id?: string | null
          onvo_subscription_id?: string | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean
          custom_wallet_limit?: number | null
          custom_contract_ref?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          org_id?: string
          plan_tier?: string
          status?: string
          onvo_customer_id?: string | null
          onvo_subscription_id?: string | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean
          custom_wallet_limit?: number | null
          custom_contract_ref?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      // ── Wallets (the usage source of truth) ───────────────────────────────
      // One row = one wallet, counted toward the org's limit regardless of
      // whether it was created via @cavos/kit (user_social_id-keyed) or
      // @cavos/react (address-keyed). A wallet is a wallet.
      wallets: {
        Row: {
          id: string
          address: string
          app_id: string
          user_social_id: string | null
          encrypted_pk_blob: string | null
          network: string
          email_verified: boolean
          email_verified_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          address: string
          app_id: string
          user_social_id?: string | null
          encrypted_pk_blob?: string | null
          network: string
          email_verified?: boolean
          email_verified_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          address?: string
          app_id?: string
          user_social_id?: string | null
          encrypted_pk_blob?: string | null
          network?: string
          email_verified?: boolean
          email_verified_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      // Authorized device signers for a device-signer wallet.
      wallet_devices: {
        Row: {
          id: string
          wallet_id: string
          pub_x: string
          pub_y: string
          device_label: string | null
          created_at: string
        }
        Insert: {
          id?: string
          wallet_id: string
          pub_x: string
          pub_y: string
          device_label?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          wallet_id?: string
          pub_x?: string
          pub_y?: string
          device_label?: string | null
          created_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      organizations: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          owner_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          owner_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          owner_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      apps: {
        Row: {
          id: string
          name: string
          description: string | null
          organization_id: string
          auth0_domain: string | null
          auth0_client_id: string | null
          auth0_client_secret_encrypted: string | null
          callback_urls: string[] | null
          allowed_logout_urls: string[] | null
          allowed_web_origins: string[] | null
          logo_url: string | null
          website_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          organization_id: string
          auth0_domain?: string | null
          auth0_client_id?: string | null
          auth0_client_secret_encrypted?: string | null
          callback_urls?: string[] | null
          allowed_logout_urls?: string[] | null
          allowed_web_origins?: string[] | null
          logo_url?: string | null
          website_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          organization_id?: string
          auth0_domain?: string | null
          auth0_client_id?: string | null
          auth0_client_secret_encrypted?: string | null
          callback_urls?: string[] | null
          allowed_logout_urls?: string[] | null
          allowed_web_origins?: string[] | null
          logo_url?: string | null
          website_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
