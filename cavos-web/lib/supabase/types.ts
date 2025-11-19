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
