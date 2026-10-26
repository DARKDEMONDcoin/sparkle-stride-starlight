export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      account_baselines: {
        Row: {
          ad_account_id: string
          benchmarks: Json
          built_at: string | null
          change_overlay: Json
          context_questions: Json
          conversion_lag: Json
          covered_entities: Json
          covered_periods: Json
          created_at: string
          data_quality: Json
          expires_at: string | null
          funnel: Json
          hypotheses: Json
          id: string
          immature_window: Json
          limitations: Json
          mode: string
          seasonality: Json
          spend_concentration: Json
          status: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          ad_account_id: string
          benchmarks?: Json
          built_at?: string | null
          change_overlay?: Json
          context_questions?: Json
          conversion_lag?: Json
          covered_entities?: Json
          covered_periods?: Json
          created_at?: string
          data_quality?: Json
          expires_at?: string | null
          funnel?: Json
          hypotheses?: Json
          id?: string
          immature_window?: Json
          limitations?: Json
          mode?: string
          seasonality?: Json
          spend_concentration?: Json
          status?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          ad_account_id?: string
          benchmarks?: Json
          built_at?: string | null
          change_overlay?: Json
          context_questions?: Json
          conversion_lag?: Json
          covered_entities?: Json
          covered_periods?: Json
          created_at?: string
          data_quality?: Json
          expires_at?: string | null
          funnel?: Json
          hypotheses?: Json
          id?: string
          immature_window?: Json
          limitations?: Json
          mode?: string
          seasonality?: Json
          spend_concentration?: Json
          status?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_baselines_ad_account_id_fkey"
            columns: ["ad_account_id"]
            isOneToOne: false
            referencedRelation: "ad_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "account_baselines_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      account_learnings: {
        Row: {
          ad_account_id: string
          confidence: string
          created_at: string
          entity_ref: Json
          evidence: Json
          id: string
          learning: string
          outcome: string
          source_change_id: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          ad_account_id: string
          confidence?: string
          created_at?: string
          entity_ref?: Json
          evidence?: Json
          id?: string
          learning: string
          outcome: string
          source_change_id?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          ad_account_id?: string
          confidence?: string
          created_at?: string
          entity_ref?: Json
          evidence?: Json
          id?: string
          learning?: string
          outcome?: string
          source_change_id?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_learnings_ad_account_id_fkey"
            columns: ["ad_account_id"]
            isOneToOne: false
            referencedRelation: "ad_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "account_learnings_source_change_id_fkey"
            columns: ["source_change_id"]
            isOneToOne: false
            referencedRelation: "change_log"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "account_learnings_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      action_audit: {
        Row: {
          action_id: string
          created_at: string
          detail: string | null
          employee_id: string
          id: string
          provider: string | null
          status: string
          summary: string | null
          workspace_id: string
        }
        Insert: {
          action_id: string
          created_at?: string
          detail?: string | null
          employee_id: string
          id?: string
          provider?: string | null
          status: string
          summary?: string | null
          workspace_id: string
        }
        Update: {
          action_id?: string
          created_at?: string
          detail?: string | null
          employee_id?: string
          id?: string
          provider?: string | null
          status?: string
          summary?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "action_audit_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_accounts: {
        Row: {
          connection_id: string
          created_at: string
          currency: string | null
          external_id: string
          id: string
          name: string | null
          platform: string
          timezone: string | null
          workspace_id: string
        }
        Insert: {
          connection_id: string
          created_at?: string
          currency?: string | null
          external_id: string
          id?: string
          name?: string | null
          platform: string
          timezone?: string | null
          workspace_id: string
        }
        Update: {
          connection_id?: string
          created_at?: string
          currency?: string | null
          external_id?: string
          id?: string
          name?: string | null
          platform?: string
          timezone?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ad_accounts_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "ad_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_accounts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_connections: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          last_error: string | null
          method: string
          platform: string
          provider: string | null
          provider_error_kind: string | null
          scopes: string[]
          status: string
          token_secret_id: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          last_error?: string | null
          method?: string
          platform: string
          provider?: string | null
          provider_error_kind?: string | null
          scopes?: string[]
          status?: string
          token_secret_id?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          last_error?: string | null
          method?: string
          platform?: string
          provider?: string | null
          provider_error_kind?: string | null
          scopes?: string[]
          status?: string
          token_secret_id?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ad_connections_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_guardrails: {
        Row: {
          baseline_freshness_days: number
          daily_audit: boolean
          forbid_stacked_major_changes: boolean
          guidelines: string
          max_budget_increase_pct: number
          monthly_cap: number | null
          new_account_min_conversions: number
          new_account_min_days: number
          updated_at: string
          workspace_id: string
        }
        Insert: {
          baseline_freshness_days?: number
          daily_audit?: boolean
          forbid_stacked_major_changes?: boolean
          guidelines?: string
          max_budget_increase_pct?: number
          monthly_cap?: number | null
          new_account_min_conversions?: number
          new_account_min_days?: number
          updated_at?: string
          workspace_id: string
        }
        Update: {
          baseline_freshness_days?: number
          daily_audit?: boolean
          forbid_stacked_major_changes?: boolean
          guidelines?: string
          max_budget_increase_pct?: number
          monthly_cap?: number | null
          new_account_min_conversions?: number
          new_account_min_days?: number
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ad_guardrails_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_jobs: {
        Row: {
          ad_account_id: string
          attempts: number
          created_at: string
          cursor: Json
          dedupe_key: string
          id: string
          kind: string
          last_error: string | null
          lease_expires_at: string | null
          lease_token: string | null
          next_attempt_at: string | null
          pause_reason: string | null
          progress: Json
          status: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          ad_account_id: string
          attempts?: number
          created_at?: string
          cursor?: Json
          dedupe_key: string
          id?: string
          kind: string
          last_error?: string | null
          lease_expires_at?: string | null
          lease_token?: string | null
          next_attempt_at?: string | null
          pause_reason?: string | null
          progress?: Json
          status?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          ad_account_id?: string
          attempts?: number
          created_at?: string
          cursor?: Json
          dedupe_key?: string
          id?: string
          kind?: string
          last_error?: string | null
          lease_expires_at?: string | null
          lease_token?: string | null
          next_attempt_at?: string | null
          pause_reason?: string | null
          progress?: Json
          status?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ad_jobs_ad_account_id_fkey"
            columns: ["ad_account_id"]
            isOneToOne: false
            referencedRelation: "ad_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_jobs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_provider_configs: {
        Row: {
          created_at: string
          platform: string
          provider: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          platform: string
          provider: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          platform?: string
          provider?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ad_provider_configs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      ads_api_versions: {
        Row: {
          created_at: string
          notes: string | null
          platform: string
          released_at: string | null
          source_url: string
          sunset_at: string | null
          sunset_month: string | null
          sunset_precision: string
          updated_at: string
          verified_at: string | null
          version: string
        }
        Insert: {
          created_at?: string
          notes?: string | null
          platform: string
          released_at?: string | null
          source_url: string
          sunset_at?: string | null
          sunset_month?: string | null
          sunset_precision?: string
          updated_at?: string
          verified_at?: string | null
          version: string
        }
        Update: {
          created_at?: string
          notes?: string | null
          platform?: string
          released_at?: string | null
          source_url?: string
          sunset_at?: string | null
          sunset_month?: string | null
          sunset_precision?: string
          updated_at?: string
          verified_at?: string | null
          version?: string
        }
        Relationships: []
      }
      ads_baseline_sources: {
        Row: {
          ad_account_id: string
          baseline_id: string
          created_at: string
          id: string
          payload: Json
          snapshot_id: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          ad_account_id: string
          baseline_id: string
          created_at?: string
          id?: string
          payload: Json
          snapshot_id: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          ad_account_id?: string
          baseline_id?: string
          created_at?: string
          id?: string
          payload?: Json
          snapshot_id?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ads_baseline_sources_ad_account_id_fkey"
            columns: ["ad_account_id"]
            isOneToOne: false
            referencedRelation: "ad_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ads_baseline_sources_baseline_id_fkey"
            columns: ["baseline_id"]
            isOneToOne: false
            referencedRelation: "account_baselines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ads_baseline_sources_snapshot_id_fkey"
            columns: ["snapshot_id"]
            isOneToOne: false
            referencedRelation: "campaign_snapshots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ads_baseline_sources_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      ads_page_fix_tickets: {
        Row: {
          ad_account_id: string
          audit_id: string
          baseline_id: string
          category: string
          created_at: string
          id: string
          implemented_at: string | null
          implemented_by: string | null
          landing_page_id: string
          review_at: string
          status: string
          steps: Json
          success_metric: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          ad_account_id: string
          audit_id: string
          baseline_id: string
          category: string
          created_at?: string
          id?: string
          implemented_at?: string | null
          implemented_by?: string | null
          landing_page_id: string
          review_at: string
          status?: string
          steps: Json
          success_metric: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          ad_account_id?: string
          audit_id?: string
          baseline_id?: string
          category?: string
          created_at?: string
          id?: string
          implemented_at?: string | null
          implemented_by?: string | null
          landing_page_id?: string
          review_at?: string
          status?: string
          steps?: Json
          success_metric?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ads_page_fix_tickets_ad_account_id_fkey"
            columns: ["ad_account_id"]
            isOneToOne: false
            referencedRelation: "ad_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ads_page_fix_tickets_audit_id_fkey"
            columns: ["audit_id"]
            isOneToOne: false
            referencedRelation: "landing_page_audits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ads_page_fix_tickets_baseline_id_fkey"
            columns: ["baseline_id"]
            isOneToOne: false
            referencedRelation: "account_baselines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ads_page_fix_tickets_landing_page_id_fkey"
            columns: ["landing_page_id"]
            isOneToOne: false
            referencedRelation: "landing_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ads_page_fix_tickets_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      ads_recommendation_reviews: {
        Row: {
          ad_account_id: string
          created_at: string
          decided_by: string
          decision: string
          id: string
          proposal: Json
          recommendation_id: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          ad_account_id: string
          created_at?: string
          decided_by: string
          decision: string
          id?: string
          proposal: Json
          recommendation_id: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          ad_account_id?: string
          created_at?: string
          decided_by?: string
          decision?: string
          id?: string
          proposal?: Json
          recommendation_id?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ads_recommendation_reviews_ad_account_id_fkey"
            columns: ["ad_account_id"]
            isOneToOne: false
            referencedRelation: "ad_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ads_recommendation_reviews_recommendation_id_fkey"
            columns: ["recommendation_id"]
            isOneToOne: false
            referencedRelation: "recommendations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ads_recommendation_reviews_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      api_usage: {
        Row: {
          created_at: string
          date: string
          id: string
          operations_count: number
          platform: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          operations_count?: number
          platform: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          operations_count?: number
          platform?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_usage_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      app_secrets: {
        Row: {
          name: string
          updated_at: string
          value: string
        }
        Insert: {
          name: string
          updated_at?: string
          value: string
        }
        Update: {
          name?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      attachments: {
        Row: {
          conversation_id: string
          created_at: string
          employee_id: string
          error: string | null
          extracted_text: string | null
          file_name: string
          id: string
          message_id: string | null
          mime_type: string
          size: number
          status: string
          storage_path: string
          summary: string | null
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          employee_id: string
          error?: string | null
          extracted_text?: string | null
          file_name: string
          id?: string
          message_id?: string | null
          mime_type?: string
          size: number
          status?: string
          storage_path: string
          summary?: string | null
          updated_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          employee_id?: string
          error?: string | null
          extracted_text?: string | null
          file_name?: string
          id?: string
          message_id?: string | null
          mime_type?: string
          size?: number
          status?: string
          storage_path?: string
          summary?: string | null
          updated_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attachments_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attachments_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_runs: {
        Row: {
          ad_account_id: string | null
          finished_at: string | null
          id: string
          started_at: string
          status: string
          summary: string | null
          trigger: string
          workspace_id: string
        }
        Insert: {
          ad_account_id?: string | null
          finished_at?: string | null
          id?: string
          started_at?: string
          status?: string
          summary?: string | null
          trigger: string
          workspace_id: string
        }
        Update: {
          ad_account_id?: string | null
          finished_at?: string | null
          id?: string
          started_at?: string
          status?: string
          summary?: string | null
          trigger?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_runs_ad_account_id_fkey"
            columns: ["ad_account_id"]
            isOneToOne: false
            referencedRelation: "ad_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_runs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      automations: {
        Row: {
          active: boolean
          auto_publish: boolean
          cadence: string
          created_at: string
          day_of_week: number
          employee_id: string
          hour: number
          id: string
          label: string
          last_run_at: string | null
          last_status: string | null
          locked_at: string | null
          next_run_at: string
          skill_id: string
          timezone: string
          updated_at: string
          values: Json
          workspace_id: string
        }
        Insert: {
          active?: boolean
          auto_publish?: boolean
          cadence?: string
          created_at?: string
          day_of_week?: number
          employee_id?: string
          hour?: number
          id?: string
          label: string
          last_run_at?: string | null
          last_status?: string | null
          locked_at?: string | null
          next_run_at?: string
          skill_id: string
          timezone?: string
          updated_at?: string
          values?: Json
          workspace_id: string
        }
        Update: {
          active?: boolean
          auto_publish?: boolean
          cadence?: string
          created_at?: string
          day_of_week?: number
          employee_id?: string
          hour?: number
          id?: string
          label?: string
          last_run_at?: string | null
          last_status?: string | null
          locked_at?: string | null
          next_run_at?: string
          skill_id?: string
          timezone?: string
          updated_at?: string
          values?: Json
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "automations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      brain_items: {
        Row: {
          body: string | null
          created_at: string
          id: string
          kind: string
          meta: string | null
          title: string
          used_by: string[]
          workspace_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          kind?: string
          meta?: string | null
          title: string
          used_by?: string[]
          workspace_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          kind?: string
          meta?: string | null
          title?: string
          used_by?: string[]
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "brain_items_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_memories: {
        Row: {
          confidence: number
          content: string
          conversation_id: string | null
          created_at: string
          employee_id: string | null
          id: string
          kind: string
          last_used_at: string | null
          source_message_id: string | null
          superseded_by: string | null
          updated_at: string
          valid_from: string
          valid_until: string | null
          workspace_id: string
        }
        Insert: {
          confidence?: number
          content: string
          conversation_id?: string | null
          created_at?: string
          employee_id?: string | null
          id?: string
          kind?: string
          last_used_at?: string | null
          source_message_id?: string | null
          superseded_by?: string | null
          updated_at?: string
          valid_from?: string
          valid_until?: string | null
          workspace_id: string
        }
        Update: {
          confidence?: number
          content?: string
          conversation_id?: string | null
          created_at?: string
          employee_id?: string | null
          id?: string
          kind?: string
          last_used_at?: string | null
          source_message_id?: string | null
          superseded_by?: string | null
          updated_at?: string
          valid_from?: string
          valid_until?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "brand_memories_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brand_memories_source_message_id_fkey"
            columns: ["source_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brand_memories_superseded_by_fkey"
            columns: ["superseded_by"]
            isOneToOne: false
            referencedRelation: "brand_memories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brand_memories_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      briefings: {
        Row: {
          content: Json
          created_at: string
          day: string
          employee_id: string
          id: string
          workspace_id: string
        }
        Insert: {
          content?: Json
          created_at?: string
          day?: string
          employee_id?: string
          id?: string
          workspace_id: string
        }
        Update: {
          content?: Json
          created_at?: string
          day?: string
          employee_id?: string
          id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "briefings_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      business_profiles: {
        Row: {
          ad_account_id: string | null
          answers: Json
          created_at: string
          id: string
          site_summary: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          ad_account_id?: string | null
          answers?: Json
          created_at?: string
          id?: string
          site_summary?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          ad_account_id?: string | null
          answers?: Json
          created_at?: string
          id?: string
          site_summary?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_profiles_ad_account_id_fkey"
            columns: ["ad_account_id"]
            isOneToOne: false
            referencedRelation: "ad_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_profiles_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_drafts: {
        Row: {
          ad_account_id: string | null
          baseline_id: string | null
          business_profile_id: string | null
          campaign_type: string | null
          created_at: string
          creatives: Json
          decided_at: string | null
          decided_by: string | null
          employee_id: string | null
          external_campaign_id: string | null
          id: string
          lessons_from_history: Json | null
          platform: string
          spec: Json
          status: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          ad_account_id?: string | null
          baseline_id?: string | null
          business_profile_id?: string | null
          campaign_type?: string | null
          created_at?: string
          creatives?: Json
          decided_at?: string | null
          decided_by?: string | null
          employee_id?: string | null
          external_campaign_id?: string | null
          id?: string
          lessons_from_history?: Json | null
          platform: string
          spec?: Json
          status?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          ad_account_id?: string | null
          baseline_id?: string | null
          business_profile_id?: string | null
          campaign_type?: string | null
          created_at?: string
          creatives?: Json
          decided_at?: string | null
          decided_by?: string | null
          employee_id?: string | null
          external_campaign_id?: string | null
          id?: string
          lessons_from_history?: Json | null
          platform?: string
          spec?: Json
          status?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_drafts_ad_account_id_fkey"
            columns: ["ad_account_id"]
            isOneToOne: false
            referencedRelation: "ad_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_drafts_baseline_id_fkey"
            columns: ["baseline_id"]
            isOneToOne: false
            referencedRelation: "account_baselines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_drafts_business_profile_id_fkey"
            columns: ["business_profile_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_drafts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_snapshots: {
        Row: {
          ad_account_id: string
          breakdowns: Json
          data_maturity: string
          day: string
          external_id: string
          fetched_at: string
          id: string
          level: string
          metrics: Json
          name: string | null
          parent_external_id: string | null
          workspace_id: string
        }
        Insert: {
          ad_account_id: string
          breakdowns?: Json
          data_maturity?: string
          day: string
          external_id: string
          fetched_at?: string
          id?: string
          level: string
          metrics?: Json
          name?: string | null
          parent_external_id?: string | null
          workspace_id: string
        }
        Update: {
          ad_account_id?: string
          breakdowns?: Json
          data_maturity?: string
          day?: string
          external_id?: string
          fetched_at?: string
          id?: string
          level?: string
          metrics?: Json
          name?: string | null
          parent_external_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_snapshots_ad_account_id_fkey"
            columns: ["ad_account_id"]
            isOneToOne: false
            referencedRelation: "ad_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_snapshots_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      change_events: {
        Row: {
          actor_type: string
          ad_account_id: string
          after_value: Json | null
          before_value: Json | null
          created_at: string
          entity_ref: Json
          event_type: string
          id: string
          occurred_at: string
          provider_event_id: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          actor_type: string
          ad_account_id: string
          after_value?: Json | null
          before_value?: Json | null
          created_at?: string
          entity_ref?: Json
          event_type: string
          id?: string
          occurred_at: string
          provider_event_id?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          actor_type?: string
          ad_account_id?: string
          after_value?: Json | null
          before_value?: Json | null
          created_at?: string
          entity_ref?: Json
          event_type?: string
          id?: string
          occurred_at?: string
          provider_event_id?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "change_events_ad_account_id_fkey"
            columns: ["ad_account_id"]
            isOneToOne: false
            referencedRelation: "ad_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "change_events_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      change_log: {
        Row: {
          ad_account_id: string | null
          after_value: Json | null
          approved_by: string
          before_value: Json | null
          created_at: string
          created_object_ids: Json
          draft_id: string | null
          entity_id: string
          id: string
          ok: boolean
          platform: string
          platform_response: Json | null
          recommendation_id: string | null
          workspace_id: string
        }
        Insert: {
          ad_account_id?: string | null
          after_value?: Json | null
          approved_by: string
          before_value?: Json | null
          created_at?: string
          created_object_ids?: Json
          draft_id?: string | null
          entity_id: string
          id?: string
          ok: boolean
          platform: string
          platform_response?: Json | null
          recommendation_id?: string | null
          workspace_id: string
        }
        Update: {
          ad_account_id?: string | null
          after_value?: Json | null
          approved_by?: string
          before_value?: Json | null
          created_at?: string
          created_object_ids?: Json
          draft_id?: string | null
          entity_id?: string
          id?: string
          ok?: boolean
          platform?: string
          platform_response?: Json | null
          recommendation_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "change_log_ad_account_id_fkey"
            columns: ["ad_account_id"]
            isOneToOne: false
            referencedRelation: "ad_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "change_log_draft_id_fkey"
            columns: ["draft_id"]
            isOneToOne: false
            referencedRelation: "campaign_drafts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "change_log_recommendation_id_fkey"
            columns: ["recommendation_id"]
            isOneToOne: false
            referencedRelation: "recommendations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "change_log_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      change_outcomes: {
        Row: {
          ad_account_id: string
          change_log_id: string
          classification: string | null
          created_at: string
          evaluated_at: string | null
          evaluation: Json | null
          expected: Json
          id: string
          pre_snapshot: Json
          review_after: string
          success_metric: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          ad_account_id: string
          change_log_id: string
          classification?: string | null
          created_at?: string
          evaluated_at?: string | null
          evaluation?: Json | null
          expected?: Json
          id?: string
          pre_snapshot: Json
          review_after: string
          success_metric: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          ad_account_id?: string
          change_log_id?: string
          classification?: string | null
          created_at?: string
          evaluated_at?: string | null
          evaluation?: Json | null
          expected?: Json
          id?: string
          pre_snapshot?: Json
          review_after?: string
          success_metric?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "change_outcomes_ad_account_id_fkey"
            columns: ["ad_account_id"]
            isOneToOne: false
            referencedRelation: "ad_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "change_outcomes_change_log_id_fkey"
            columns: ["change_log_id"]
            isOneToOne: true
            referencedRelation: "change_log"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "change_outcomes_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      collaboration_activity: {
        Row: {
          actor_id: string | null
          created_at: string
          employee_id: string | null
          id: string
          kind: string
          project_id: string | null
          summary: string
          task_id: string | null
          workspace_id: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          employee_id?: string | null
          id?: string
          kind: string
          project_id?: string | null
          summary: string
          task_id?: string | null
          workspace_id: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          employee_id?: string | null
          id?: string
          kind?: string
          project_id?: string | null
          summary?: string
          task_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collaboration_activity_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "collaboration_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collaboration_activity_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "collaboration_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collaboration_activity_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      collaboration_attachments: {
        Row: {
          created_at: string
          id: string
          name: string
          path: string
          size: number
          task_id: string
          uploaded_by: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          path: string
          size?: number
          task_id: string
          uploaded_by: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          path?: string
          size?: number
          task_id?: string
          uploaded_by?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collaboration_attachments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "collaboration_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      collaboration_comments: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          mentions: string[]
          task_id: string
          workspace_id: string
        }
        Insert: {
          author_id?: string
          body: string
          created_at?: string
          id?: string
          mentions?: string[]
          task_id: string
          workspace_id: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          mentions?: string[]
          task_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collaboration_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "collaboration_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collaboration_comments_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      collaboration_projects: {
        Row: {
          created_at: string
          created_by: string
          description: string
          id: string
          name: string
          status: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string
          id?: string
          name: string
          status?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string
          id?: string
          name?: string
          status?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collaboration_projects_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      collaboration_tasks: {
        Row: {
          ai_employee_id: string | null
          ai_output: string | null
          ai_status: string
          assignee_id: string | null
          created_at: string
          created_by: string
          details: string
          due_date: string | null
          id: string
          notes: string
          priority: string
          project_id: string
          source: string
          status: string
          title: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          ai_employee_id?: string | null
          ai_output?: string | null
          ai_status?: string
          assignee_id?: string | null
          created_at?: string
          created_by: string
          details?: string
          due_date?: string | null
          id?: string
          notes?: string
          priority?: string
          project_id: string
          source?: string
          status?: string
          title: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          ai_employee_id?: string | null
          ai_output?: string | null
          ai_status?: string
          assignee_id?: string | null
          created_at?: string
          created_by?: string
          details?: string
          due_date?: string | null
          id?: string
          notes?: string
          priority?: string
          project_id?: string
          source?: string
          status?: string
          title?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collaboration_tasks_project_id_workspace_id_fkey"
            columns: ["project_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "collaboration_projects"
            referencedColumns: ["id", "workspace_id"]
          },
        ]
      }
      command_drafts: {
        Row: {
          body: string
          channel: string
          created_at: string
          employee_id: string
          external_id: string
          id: string
          image_url: string | null
          last_error: string | null
          providers: string[]
          request: string
          status: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          body?: string
          channel?: string
          created_at?: string
          employee_id?: string
          external_id: string
          id?: string
          image_url?: string | null
          last_error?: string | null
          providers?: string[]
          request?: string
          status?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          body?: string
          channel?: string
          created_at?: string
          employee_id?: string
          external_id?: string
          id?: string
          image_url?: string | null
          last_error?: string | null
          providers?: string[]
          request?: string
          status?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "command_drafts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      command_link_codes: {
        Row: {
          channel: string
          code: string
          created_at: string
          expires_at: string
          label: string | null
          role: string
          used_at: string | null
          workspace_id: string
        }
        Insert: {
          channel?: string
          code: string
          created_at?: string
          expires_at: string
          label?: string | null
          role?: string
          used_at?: string | null
          workspace_id: string
        }
        Update: {
          channel?: string
          code?: string
          created_at?: string
          expires_at?: string
          label?: string | null
          role?: string
          used_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "command_link_codes_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      command_links: {
        Row: {
          active_employee: string | null
          channel: string
          conversation_ids: Json
          created_at: string
          external_id: string
          id: string
          label: string | null
          last_seen_at: string | null
          last_update_id: number | null
          pending_input: Json | null
          role: string
          status: string
          workspace_id: string
        }
        Insert: {
          active_employee?: string | null
          channel?: string
          conversation_ids?: Json
          created_at?: string
          external_id: string
          id?: string
          label?: string | null
          last_seen_at?: string | null
          last_update_id?: number | null
          pending_input?: Json | null
          role?: string
          status?: string
          workspace_id: string
        }
        Update: {
          active_employee?: string | null
          channel?: string
          conversation_ids?: Json
          created_at?: string
          external_id?: string
          id?: string
          label?: string | null
          last_seen_at?: string | null
          last_update_id?: number | null
          pending_input?: Json | null
          role?: string
          status?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "command_links_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          employee_id: string
          id: string
          last_employee_message: string | null
          last_employee_message_at: string | null
          title: string
          unread_count: number
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          employee_id: string
          id?: string
          last_employee_message?: string | null
          last_employee_message_at?: string | null
          title?: string
          unread_count?: number
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          employee_id?: string
          id?: string
          last_employee_message?: string | null
          last_employee_message_at?: string | null
          title?: string
          unread_count?: number
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      creative_concepts: {
        Row: {
          ad_account_id: string | null
          angle: string
          created_at: string
          formats: string[]
          hook: string | null
          hypothesis: string
          id: string
          offer: string
          persona: string
          results: Json
          status: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          ad_account_id?: string | null
          angle: string
          created_at?: string
          formats?: string[]
          hook?: string | null
          hypothesis: string
          id?: string
          offer: string
          persona: string
          results?: Json
          status?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          ad_account_id?: string | null
          angle?: string
          created_at?: string
          formats?: string[]
          hook?: string | null
          hypothesis?: string
          id?: string
          offer?: string
          persona?: string
          results?: Json
          status?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "creative_concepts_ad_account_id_fkey"
            columns: ["ad_account_id"]
            isOneToOne: false
            referencedRelation: "ad_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creative_concepts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      decisions: {
        Row: {
          conversation_id: string | null
          created_at: string
          decision: string
          employee_id: string
          id: string
          kind: string
          rationale: string | null
          status: string
          superseded_by: string | null
          title: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string
          decision: string
          employee_id: string
          id?: string
          kind?: string
          rationale?: string | null
          status?: string
          superseded_by?: string | null
          title: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          conversation_id?: string | null
          created_at?: string
          decision?: string
          employee_id?: string
          id?: string
          kind?: string
          rationale?: string | null
          status?: string
          superseded_by?: string | null
          title?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "decisions_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decisions_superseded_by_fkey"
            columns: ["superseded_by"]
            isOneToOne: false
            referencedRelation: "decisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decisions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_evaluations: {
        Row: {
          baseline_score: number | null
          candidate_score: number | null
          created_at: string
          details: Json
          employee_id: string
          id: string
          improvement: number | null
          lesson_id: string
          safety_passed: boolean
          sample_size: number
          workspace_id: string
        }
        Insert: {
          baseline_score?: number | null
          candidate_score?: number | null
          created_at?: string
          details?: Json
          employee_id: string
          id?: string
          improvement?: number | null
          lesson_id: string
          safety_passed?: boolean
          sample_size?: number
          workspace_id: string
        }
        Update: {
          baseline_score?: number | null
          candidate_score?: number | null
          created_at?: string
          details?: Json
          employee_id?: string
          id?: string
          improvement?: number | null
          lesson_id?: string
          safety_passed?: boolean
          sample_size?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_evaluations_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "employee_lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_evaluations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_feedback: {
        Row: {
          created_at: string
          edited_text: string | null
          employee_id: string
          id: string
          kind: string
          metrics: Json
          original_text: string | null
          reason: string | null
          run_id: string | null
          task_id: string | null
          weight: number
          workspace_id: string
        }
        Insert: {
          created_at?: string
          edited_text?: string | null
          employee_id: string
          id?: string
          kind: string
          metrics?: Json
          original_text?: string | null
          reason?: string | null
          run_id?: string | null
          task_id?: string | null
          weight?: number
          workspace_id: string
        }
        Update: {
          created_at?: string
          edited_text?: string | null
          employee_id?: string
          id?: string
          kind?: string
          metrics?: Json
          original_text?: string | null
          reason?: string | null
          run_id?: string | null
          task_id?: string | null
          weight?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_feedback_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "employee_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_feedback_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_feedback_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_learning_settings: {
        Row: {
          auto_promote_low_risk: boolean
          created_at: string
          enabled: boolean
          experiment_percent: number
          minimum_evidence: number
          minimum_improvement: number
          paused_reason: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          auto_promote_low_risk?: boolean
          created_at?: string
          enabled?: boolean
          experiment_percent?: number
          minimum_evidence?: number
          minimum_improvement?: number
          paused_reason?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          auto_promote_low_risk?: boolean
          created_at?: string
          enabled?: boolean
          experiment_percent?: number
          minimum_evidence?: number
          minimum_improvement?: number
          paused_reason?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_learning_settings_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_lessons: {
        Row: {
          activated_at: string | null
          confidence: number
          created_at: string
          employee_id: string
          evidence: Json
          evidence_count: number
          expires_at: string | null
          failure_count: number
          id: string
          instruction: string
          risk_level: string
          scope: string
          source_kind: string
          status: string
          success_count: number
          supersedes_id: string | null
          title: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          activated_at?: string | null
          confidence?: number
          created_at?: string
          employee_id: string
          evidence?: Json
          evidence_count?: number
          expires_at?: string | null
          failure_count?: number
          id?: string
          instruction: string
          risk_level?: string
          scope?: string
          source_kind?: string
          status?: string
          success_count?: number
          supersedes_id?: string | null
          title: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          activated_at?: string | null
          confidence?: number
          created_at?: string
          employee_id?: string
          evidence?: Json
          evidence_count?: number
          expires_at?: string | null
          failure_count?: number
          id?: string
          instruction?: string
          risk_level?: string
          scope?: string
          source_kind?: string
          status?: string
          success_count?: number
          supersedes_id?: string | null
          title?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_lessons_supersedes_id_fkey"
            columns: ["supersedes_id"]
            isOneToOne: false
            referencedRelation: "employee_lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_lessons_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_policies: {
        Row: {
          auto_approve_low_risk: boolean
          can_browse: boolean
          can_publish: boolean
          can_send: boolean
          created_at: string
          daily_action_cap: number
          employee_id: string
          enabled: boolean
          updated_at: string
          workspace_id: string
        }
        Insert: {
          auto_approve_low_risk?: boolean
          can_browse?: boolean
          can_publish?: boolean
          can_send?: boolean
          created_at?: string
          daily_action_cap?: number
          employee_id: string
          enabled?: boolean
          updated_at?: string
          workspace_id: string
        }
        Update: {
          auto_approve_low_risk?: boolean
          can_browse?: boolean
          can_publish?: boolean
          can_send?: boolean
          created_at?: string
          daily_action_cap?: number
          employee_id?: string
          enabled?: boolean
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_policies_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_runs: {
        Row: {
          applied_lesson_ids: string[]
          capability: string | null
          conversation_id: string | null
          created_at: string
          employee_id: string
          final_output: string
          id: string
          message_id: string | null
          original_output: string
          outcome: string
          policy_version: number
          quality_issues: Json
          quality_score: number | null
          request_text: string
          task_id: string | null
          updated_at: string
          was_revised: boolean
          workspace_id: string
        }
        Insert: {
          applied_lesson_ids?: string[]
          capability?: string | null
          conversation_id?: string | null
          created_at?: string
          employee_id: string
          final_output: string
          id?: string
          message_id?: string | null
          original_output: string
          outcome?: string
          policy_version?: number
          quality_issues?: Json
          quality_score?: number | null
          request_text: string
          task_id?: string | null
          updated_at?: string
          was_revised?: boolean
          workspace_id: string
        }
        Update: {
          applied_lesson_ids?: string[]
          capability?: string | null
          conversation_id?: string | null
          created_at?: string
          employee_id?: string
          final_output?: string
          id?: string
          message_id?: string | null
          original_output?: string
          outcome?: string
          policy_version?: number
          quality_issues?: Json
          quality_score?: number | null
          request_text?: string
          task_id?: string | null
          updated_at?: string
          was_revised?: boolean
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_runs_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_runs_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_runs_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_runs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      experiments: {
        Row: {
          ad_account_id: string
          created_at: string
          end_date: string | null
          hypothesis: string
          id: string
          planned_sample_or_duration: Json
          result_summary: Json | null
          start_date: string | null
          status: string
          success_criteria: Json
          updated_at: string
          variable_tested: string
          workspace_id: string
        }
        Insert: {
          ad_account_id: string
          created_at?: string
          end_date?: string | null
          hypothesis: string
          id?: string
          planned_sample_or_duration?: Json
          result_summary?: Json | null
          start_date?: string | null
          status?: string
          success_criteria?: Json
          updated_at?: string
          variable_tested: string
          workspace_id: string
        }
        Update: {
          ad_account_id?: string
          created_at?: string
          end_date?: string | null
          hypothesis?: string
          id?: string
          planned_sample_or_duration?: Json
          result_summary?: Json | null
          start_date?: string | null
          status?: string
          success_criteria?: Json
          updated_at?: string
          variable_tested?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "experiments_ad_account_id_fkey"
            columns: ["ad_account_id"]
            isOneToOne: false
            referencedRelation: "ad_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "experiments_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      inbound_emails: {
        Row: {
          created_at: string
          email_id: string
          employee_id: string
          sender: string
          status: string
          subject: string | null
          workspace_id: string | null
        }
        Insert: {
          created_at?: string
          email_id: string
          employee_id: string
          sender: string
          status?: string
          subject?: string | null
          workspace_id?: string | null
        }
        Update: {
          created_at?: string
          email_id?: string
          employee_id?: string
          sender?: string
          status?: string
          subject?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inbound_emails_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      inbox_alerts: {
        Row: {
          created_at: string
          id: string
          kind: string
          message_id: string
          sender: string | null
          subject: string | null
          summary: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          message_id: string
          sender?: string | null
          subject?: string | null
          summary?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          message_id?: string
          sender?: string | null
          subject?: string | null
          summary?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inbox_alerts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_credentials: {
        Row: {
          config: Json
          created_at: string
          id: string
          provider: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          config?: Json
          created_at?: string
          id?: string
          provider: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          config?: Json
          created_at?: string
          id?: string
          provider?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_credentials_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_events: {
        Row: {
          action: string
          created_at: string
          detail: Json | null
          event_key: string
          id: string
          provider: string
          status: string
          workspace_id: string
        }
        Insert: {
          action: string
          created_at?: string
          detail?: Json | null
          event_key: string
          id?: string
          provider: string
          status?: string
          workspace_id: string
        }
        Update: {
          action?: string
          created_at?: string
          detail?: Json | null
          event_key?: string
          id?: string
          provider?: string
          status?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_events_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      integrations: {
        Row: {
          account: string | null
          created_at: string
          employee_id: string
          id: string
          provider: string
          status: string
          workspace_id: string
        }
        Insert: {
          account?: string | null
          created_at?: string
          employee_id: string
          id?: string
          provider: string
          status?: string
          workspace_id: string
        }
        Update: {
          account?: string | null
          created_at?: string
          employee_id?: string
          id?: string
          provider?: string
          status?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "integrations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_chunks: {
        Row: {
          content: string
          created_at: string
          embedding: string
          id: string
          position: number
          source: string
          title: string | null
          workspace_id: string
        }
        Insert: {
          content: string
          created_at?: string
          embedding: string
          id?: string
          position?: number
          source: string
          title?: string | null
          workspace_id: string
        }
        Update: {
          content?: string
          created_at?: string
          embedding?: string
          id?: string
          position?: number
          source?: string
          title?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_chunks_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      landing_page_audits: {
        Row: {
          ad_account_id: string
          confidence: string
          content_analysis: Json
          created_at: string
          device: string
          fetched_at: string
          id: string
          landing_page_id: string
          limitations: Json
          psi: Json
          scores: Json
          tracking_findings: Json
          updated_at: string
          workspace_id: string
        }
        Insert: {
          ad_account_id: string
          confidence?: string
          content_analysis?: Json
          created_at?: string
          device: string
          fetched_at?: string
          id?: string
          landing_page_id: string
          limitations?: Json
          psi?: Json
          scores?: Json
          tracking_findings?: Json
          updated_at?: string
          workspace_id: string
        }
        Update: {
          ad_account_id?: string
          confidence?: string
          content_analysis?: Json
          created_at?: string
          device?: string
          fetched_at?: string
          id?: string
          landing_page_id?: string
          limitations?: Json
          psi?: Json
          scores?: Json
          tracking_findings?: Json
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "landing_page_audits_ad_account_id_fkey"
            columns: ["ad_account_id"]
            isOneToOne: false
            referencedRelation: "ad_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "landing_page_audits_landing_page_id_fkey"
            columns: ["landing_page_id"]
            isOneToOne: false
            referencedRelation: "landing_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "landing_page_audits_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      landing_page_metrics_daily: {
        Row: {
          ad_account_id: string
          clicks: number
          conversion_value: number | null
          conversions: number
          created_at: string
          data_maturity: string
          date: string
          device: string
          id: string
          landing_page_id: string
          landing_page_views: number | null
          outbound_clicks: number | null
          platform: string
          speed_validity_metrics: Json
          spend: number
          updated_at: string
          workspace_id: string
        }
        Insert: {
          ad_account_id: string
          clicks?: number
          conversion_value?: number | null
          conversions?: number
          created_at?: string
          data_maturity?: string
          date: string
          device?: string
          id?: string
          landing_page_id: string
          landing_page_views?: number | null
          outbound_clicks?: number | null
          platform: string
          speed_validity_metrics?: Json
          spend?: number
          updated_at?: string
          workspace_id: string
        }
        Update: {
          ad_account_id?: string
          clicks?: number
          conversion_value?: number | null
          conversions?: number
          created_at?: string
          data_maturity?: string
          date?: string
          device?: string
          id?: string
          landing_page_id?: string
          landing_page_views?: number | null
          outbound_clicks?: number | null
          platform?: string
          speed_validity_metrics?: Json
          spend?: number
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "landing_page_metrics_daily_ad_account_id_fkey"
            columns: ["ad_account_id"]
            isOneToOne: false
            referencedRelation: "ad_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "landing_page_metrics_daily_landing_page_id_fkey"
            columns: ["landing_page_id"]
            isOneToOne: false
            referencedRelation: "landing_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "landing_page_metrics_daily_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      landing_pages: {
        Row: {
          ad_account_id: string
          audit_not_before: string | null
          created_at: string
          first_seen: string
          id: string
          last_seen: string
          platforms: string[]
          source: string
          updated_at: string
          url_normalized: string
          workspace_id: string
        }
        Insert: {
          ad_account_id: string
          audit_not_before?: string | null
          created_at?: string
          first_seen?: string
          id?: string
          last_seen?: string
          platforms?: string[]
          source: string
          updated_at?: string
          url_normalized: string
          workspace_id: string
        }
        Update: {
          ad_account_id?: string
          audit_not_before?: string | null
          created_at?: string
          first_seen?: string
          id?: string
          last_seen?: string
          platforms?: string[]
          source?: string
          updated_at?: string
          url_normalized?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "landing_pages_ad_account_id_fkey"
            columns: ["ad_account_id"]
            isOneToOne: false
            referencedRelation: "ad_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "landing_pages_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      live_snapshots: {
        Row: {
          captured_at: string
          key: string
          kind: string
          payload: Json
        }
        Insert: {
          captured_at?: string
          key: string
          kind: string
          payload?: Json
        }
        Update: {
          captured_at?: string
          key?: string
          kind?: string
          payload?: Json
        }
        Relationships: []
      }
      messages: {
        Row: {
          body: string
          conversation_id: string | null
          created_at: string
          employee_id: string
          id: string
          outputs: Json | null
          pending_action: Json | null
          role: string
          sender_id: string | null
          sender_name: string | null
          source: string
          task_id: string | null
          workspace_id: string
        }
        Insert: {
          body: string
          conversation_id?: string | null
          created_at?: string
          employee_id: string
          id?: string
          outputs?: Json | null
          pending_action?: Json | null
          role: string
          sender_id?: string | null
          sender_name?: string | null
          source?: string
          task_id?: string | null
          workspace_id: string
        }
        Update: {
          body?: string
          conversation_id?: string | null
          created_at?: string
          employee_id?: string
          id?: string
          outputs?: Json | null
          pending_action?: Json | null
          role?: string
          sender_id?: string | null
          sender_name?: string | null
          source?: string
          task_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      meta_connections: {
        Row: {
          created_at: string
          id: string
          ig_user_id: string | null
          ig_username: string | null
          kind: string
          last_error: string | null
          page_access_token: string
          page_id: string
          page_name: string | null
          scopes: string[]
          status: string
          token_expires_at: string | null
          updated_at: string
          user_access_token: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          ig_user_id?: string | null
          ig_username?: string | null
          kind: string
          last_error?: string | null
          page_access_token: string
          page_id: string
          page_name?: string | null
          scopes?: string[]
          status?: string
          token_expires_at?: string | null
          updated_at?: string
          user_access_token?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          ig_user_id?: string | null
          ig_username?: string | null
          kind?: string
          last_error?: string | null
          page_access_token?: string
          page_id?: string
          page_name?: string | null
          scopes?: string[]
          status?: string
          token_expires_at?: string | null
          updated_at?: string
          user_access_token?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meta_connections_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      n8n: {
        Row: {
          created_at: string
          id: number
        }
        Insert: {
          created_at?: string
          id?: number
        }
        Update: {
          created_at?: string
          id?: number
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          approval_ready: boolean
          created_at: string
          digest_frequency: string
          integration_disconnected: boolean
          publishing_failed: boolean
          task_digest: boolean
          timezone: string
          updated_at: string
          user_id: string
          weekly_summary: boolean
        }
        Insert: {
          approval_ready?: boolean
          created_at?: string
          digest_frequency?: string
          integration_disconnected?: boolean
          publishing_failed?: boolean
          task_digest?: boolean
          timezone?: string
          updated_at?: string
          user_id: string
          weekly_summary?: boolean
        }
        Update: {
          approval_ready?: boolean
          created_at?: string
          digest_frequency?: string
          integration_disconnected?: boolean
          publishing_failed?: boolean
          task_digest?: boolean
          timezone?: string
          updated_at?: string
          user_id?: string
          weekly_summary?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pipedream_accounts: {
        Row: {
          account_id: string
          account_name: string | null
          app_slug: string
          connected_at: string
          healthy: boolean
          id: string
          instagram_business_id: string | null
          last_error: string | null
          page_id: string | null
          provider: string
          status: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          account_id: string
          account_name?: string | null
          app_slug: string
          connected_at?: string
          healthy?: boolean
          id?: string
          instagram_business_id?: string | null
          last_error?: string | null
          page_id?: string | null
          provider: string
          status?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          account_id?: string
          account_name?: string | null
          app_slug?: string
          connected_at?: string
          healthy?: boolean
          id?: string
          instagram_business_id?: string | null
          last_error?: string | null
          page_id?: string | null
          provider?: string
          status?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pipedream_accounts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      product_feedback: {
        Row: {
          created_at: string
          id: string
          kind: string
          message: string
          page_path: string | null
          rating: number
          status: string
          updated_at: string
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          message: string
          page_path?: string | null
          rating: number
          status?: string
          updated_at?: string
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          message?: string
          page_path?: string | null
          rating?: number
          status?: string
          updated_at?: string
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_feedback_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company: string | null
          created_at: string
          dialect: string
          full_name: string | null
          id: string
          job_title: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          dialect?: string
          full_name?: string | null
          id: string
          job_title?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          dialect?: string
          full_name?: string | null
          id?: string
          job_title?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      proposals: {
        Row: {
          created_at: string
          employee_id: string
          id: string
          impact: string | null
          priority: number
          reason: string
          signal: string
          skill_id: string | null
          status: string
          task_id: string | null
          title: string
          updated_at: string
          values: Json
          workspace_id: string
        }
        Insert: {
          created_at?: string
          employee_id: string
          id?: string
          impact?: string | null
          priority?: number
          reason: string
          signal: string
          skill_id?: string | null
          status?: string
          task_id?: string | null
          title: string
          updated_at?: string
          values?: Json
          workspace_id: string
        }
        Update: {
          created_at?: string
          employee_id?: string
          id?: string
          impact?: string | null
          priority?: number
          reason?: string
          signal?: string
          skill_id?: string | null
          status?: string
          task_id?: string | null
          title?: string
          updated_at?: string
          values?: Json
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposals_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      rank_snapshots: {
        Row: {
          captured_at: string
          clicks: number | null
          competitors: Json | null
          id: string
          impressions: number | null
          keyword_id: string
          position: number | null
          source: string
          url: string | null
          workspace_id: string
        }
        Insert: {
          captured_at?: string
          clicks?: number | null
          competitors?: Json | null
          id?: string
          impressions?: number | null
          keyword_id: string
          position?: number | null
          source?: string
          url?: string | null
          workspace_id: string
        }
        Update: {
          captured_at?: string
          clicks?: number | null
          competitors?: Json | null
          id?: string
          impressions?: number | null
          keyword_id?: string
          position?: number | null
          source?: string
          url?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rank_snapshots_keyword_id_fkey"
            columns: ["keyword_id"]
            isOneToOne: false
            referencedRelation: "tracked_keywords"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rank_snapshots_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limits: {
        Row: {
          bucket: string
          hits: number
          id: string
          identifier: string
          window_start: string
        }
        Insert: {
          bucket: string
          hits?: number
          id?: string
          identifier: string
          window_start?: string
        }
        Update: {
          bucket?: string
          hits?: number
          id?: string
          identifier?: string
          window_start?: string
        }
        Relationships: []
      }
      recommendations: {
        Row: {
          ad_account_id: string | null
          baseline_id: string | null
          basis: string | null
          confidence: string | null
          created_at: string
          decided_at: string | null
          decided_by: string | null
          employee_id: string | null
          error: string | null
          estimated_impact: string | null
          evidence: Json
          history_evidence: Json | null
          id: string
          implementation_status: string | null
          pre_change_snapshot: Json | null
          proposed_change: Json
          rationale: string
          review_after_date: string | null
          risk_level: string
          status: string
          success_metric: string | null
          title: string
          type: string
          workspace_id: string
        }
        Insert: {
          ad_account_id?: string | null
          baseline_id?: string | null
          basis?: string | null
          confidence?: string | null
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          employee_id?: string | null
          error?: string | null
          estimated_impact?: string | null
          evidence?: Json
          history_evidence?: Json | null
          id?: string
          implementation_status?: string | null
          pre_change_snapshot?: Json | null
          proposed_change?: Json
          rationale: string
          review_after_date?: string | null
          risk_level?: string
          status?: string
          success_metric?: string | null
          title: string
          type: string
          workspace_id: string
        }
        Update: {
          ad_account_id?: string | null
          baseline_id?: string | null
          basis?: string | null
          confidence?: string | null
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          employee_id?: string | null
          error?: string | null
          estimated_impact?: string | null
          evidence?: Json
          history_evidence?: Json | null
          id?: string
          implementation_status?: string | null
          pre_change_snapshot?: Json | null
          proposed_change?: Json
          rationale?: string
          review_after_date?: string | null
          risk_level?: string
          status?: string
          success_metric?: string | null
          title?: string
          type?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recommendations_ad_account_id_fkey"
            columns: ["ad_account_id"]
            isOneToOne: false
            referencedRelation: "ad_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recommendations_baseline_id_fkey"
            columns: ["baseline_id"]
            isOneToOne: false
            referencedRelation: "account_baselines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recommendations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_accounts: {
        Row: {
          code: string
          created_at: string
          payout_destination: string | null
          payout_method: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          payout_destination?: string | null
          payout_method?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          payout_destination?: string | null
          payout_method?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      referral_attributions: {
        Row: {
          attributed_at: string
          code: string
          first_paid_at: string | null
          id: string
          referred_user_id: string
          referrer_user_id: string
          status: string
          updated_at: string
        }
        Insert: {
          attributed_at?: string
          code: string
          first_paid_at?: string | null
          id?: string
          referred_user_id: string
          referrer_user_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          attributed_at?: string
          code?: string
          first_paid_at?: string | null
          id?: string
          referred_user_id?: string
          referrer_user_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_attributions_code_fkey"
            columns: ["code"]
            isOneToOne: false
            referencedRelation: "referral_accounts"
            referencedColumns: ["code"]
          },
        ]
      }
      referral_clicks: {
        Row: {
          code: string
          created_at: string
          id: string
          landing_path: string
          visitor_hash: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          landing_path?: string
          visitor_hash: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          landing_path?: string
          visitor_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_clicks_code_fkey"
            columns: ["code"]
            isOneToOne: false
            referencedRelation: "referral_accounts"
            referencedColumns: ["code"]
          },
        ]
      }
      referral_commissions: {
        Row: {
          approved_at: string | null
          attribution_id: string
          commission_amount_cents: number
          commission_rate: number
          created_at: string
          currency: string
          gross_amount_cents: number
          held_until: string
          id: string
          paid_at: string | null
          payment_reference: string
          referrer_user_id: string
          reversal_reason: string | null
          reversed_at: string | null
          status: string
        }
        Insert: {
          approved_at?: string | null
          attribution_id: string
          commission_amount_cents: number
          commission_rate: number
          created_at?: string
          currency?: string
          gross_amount_cents: number
          held_until?: string
          id?: string
          paid_at?: string | null
          payment_reference: string
          referrer_user_id: string
          reversal_reason?: string | null
          reversed_at?: string | null
          status?: string
        }
        Update: {
          approved_at?: string | null
          attribution_id?: string
          commission_amount_cents?: number
          commission_rate?: number
          created_at?: string
          currency?: string
          gross_amount_cents?: number
          held_until?: string
          id?: string
          paid_at?: string | null
          payment_reference?: string
          referrer_user_id?: string
          reversal_reason?: string | null
          reversed_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_commissions_attribution_id_fkey"
            columns: ["attribution_id"]
            isOneToOne: false
            referencedRelation: "referral_attributions"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_payout_requests: {
        Row: {
          amount_cents: number
          currency: string
          destination: string
          id: string
          method: string
          note: string | null
          paid_at: string | null
          requested_at: string
          reviewed_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          amount_cents: number
          currency?: string
          destination: string
          id?: string
          method: string
          note?: string | null
          paid_at?: string | null
          requested_at?: string
          reviewed_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          amount_cents?: number
          currency?: string
          destination?: string
          id?: string
          method?: string
          note?: string | null
          paid_at?: string | null
          requested_at?: string
          reviewed_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      serp_cache: {
        Row: {
          cache_key: string
          created_at: string
          payload: Json
        }
        Insert: {
          cache_key: string
          created_at?: string
          payload: Json
        }
        Update: {
          cache_key?: string
          created_at?: string
          payload?: Json
        }
        Relationships: []
      }
      shared_outputs: {
        Row: {
          body: string
          created_at: string
          employee_id: string | null
          expires_at: string | null
          id: string
          revoked: boolean
          title: string
          token: string
          views: number
          workspace_id: string
        }
        Insert: {
          body: string
          created_at?: string
          employee_id?: string | null
          expires_at?: string | null
          id?: string
          revoked?: boolean
          title: string
          token?: string
          views?: number
          workspace_id: string
        }
        Update: {
          body?: string
          created_at?: string
          employee_id?: string | null
          expires_at?: string | null
          id?: string
          revoked?: boolean
          title?: string
          token?: string
          views?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_outputs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      site_assets: {
        Row: {
          alt: string | null
          created_at: string
          id: string
          kind: string
          page_url: string | null
          source: string
          url: string
          weight: number
          workspace_id: string
        }
        Insert: {
          alt?: string | null
          created_at?: string
          id?: string
          kind?: string
          page_url?: string | null
          source?: string
          url: string
          weight?: number
          workspace_id: string
        }
        Update: {
          alt?: string | null
          created_at?: string
          id?: string
          kind?: string
          page_url?: string | null
          source?: string
          url?: string
          weight?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_assets_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      site_visits: {
        Row: {
          country: string | null
          created_at: string
          host: string | null
          id: string
          path: string
          referrer: string | null
          source: string | null
          visitor_hash: string | null
          workspace_id: string
        }
        Insert: {
          country?: string | null
          created_at?: string
          host?: string | null
          id?: string
          path?: string
          referrer?: string | null
          source?: string | null
          visitor_hash?: string | null
          workspace_id: string
        }
        Update: {
          country?: string | null
          created_at?: string
          host?: string | null
          id?: string
          path?: string
          referrer?: string | null
          source?: string | null
          visitor_hash?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_visits_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      social_autopilot: {
        Row: {
          active: boolean
          brief: string
          created_at: string
          days: number[]
          dialect: string
          employee_id: string
          hours: number[]
          id: string
          last_run_at: string | null
          last_status: string | null
          locked_at: string | null
          mode: string
          next_run_at: string
          paused_reason: string | null
          posts_per_day: number
          providers: string[]
          slots: string[]
          timezone: string
          updated_at: string
          with_image: boolean
          workspace_id: string
        }
        Insert: {
          active?: boolean
          brief?: string
          created_at?: string
          days?: number[]
          dialect?: string
          employee_id?: string
          hours?: number[]
          id?: string
          last_run_at?: string | null
          last_status?: string | null
          locked_at?: string | null
          mode?: string
          next_run_at?: string
          paused_reason?: string | null
          posts_per_day?: number
          providers?: string[]
          slots?: string[]
          timezone?: string
          updated_at?: string
          with_image?: boolean
          workspace_id: string
        }
        Update: {
          active?: boolean
          brief?: string
          created_at?: string
          days?: number[]
          dialect?: string
          employee_id?: string
          hours?: number[]
          id?: string
          last_run_at?: string | null
          last_status?: string | null
          locked_at?: string | null
          mode?: string
          next_run_at?: string
          paused_reason?: string | null
          posts_per_day?: number
          providers?: string[]
          slots?: string[]
          timezone?: string
          updated_at?: string
          with_image?: boolean
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_autopilot_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      social_posts: {
        Row: {
          attempts: number
          body: string
          created_at: string
          employee_id: string
          id: string
          image_url: string | null
          last_error: string | null
          locked_at: string | null
          meta: Json
          metrics: Json | null
          provider: string
          published_at: string | null
          remote_ref: string | null
          scheduled_at: string
          status: string
          task_id: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          attempts?: number
          body: string
          created_at?: string
          employee_id?: string
          id?: string
          image_url?: string | null
          last_error?: string | null
          locked_at?: string | null
          meta?: Json
          metrics?: Json | null
          provider: string
          published_at?: string | null
          remote_ref?: string | null
          scheduled_at?: string
          status?: string
          task_id?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          attempts?: number
          body?: string
          created_at?: string
          employee_id?: string
          id?: string
          image_url?: string | null
          last_error?: string | null
          locked_at?: string | null
          meta?: Json
          metrics?: Json | null
          provider?: string
          published_at?: string | null
          remote_ref?: string | null
          scheduled_at?: string
          status?: string
          task_id?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_posts_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_posts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      structure_audits: {
        Row: {
          ad_account_id: string
          coverage: Json
          created_at: string
          id: string
          limitations: Json
          platform: string
          recommendations: Json
          score: number | null
          symptoms: Json
          updated_at: string
          workspace_id: string
        }
        Insert: {
          ad_account_id: string
          coverage?: Json
          created_at?: string
          id?: string
          limitations?: Json
          platform: string
          recommendations?: Json
          score?: number | null
          symptoms?: Json
          updated_at?: string
          workspace_id: string
        }
        Update: {
          ad_account_id?: string
          coverage?: Json
          created_at?: string
          id?: string
          limitations?: Json
          platform?: string
          recommendations?: Json
          score?: number | null
          symptoms?: Json
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "structure_audits_ad_account_id_fkey"
            columns: ["ad_account_id"]
            isOneToOne: false
            referencedRelation: "ad_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "structure_audits_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      support_requests: {
        Row: {
          created_at: string
          id: string
          message: string
          page_path: string | null
          priority: string
          status: string
          subject: string
          updated_at: string
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          page_path?: string | null
          priority?: string
          status?: string
          subject: string
          updated_at?: string
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          page_path?: string | null
          priority?: string
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_requests_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          channel: string
          created_at: string
          detail: string | null
          employee_id: string
          id: string
          kind: string
          output: string | null
          scheduled: string | null
          status: string
          steps: Json
          title: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          channel?: string
          created_at?: string
          detail?: string | null
          employee_id: string
          id?: string
          kind?: string
          output?: string | null
          scheduled?: string | null
          status?: string
          steps?: Json
          title: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          channel?: string
          created_at?: string
          detail?: string | null
          employee_id?: string
          id?: string
          kind?: string
          output?: string | null
          scheduled?: string | null
          status?: string
          steps?: Json
          title?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      team_task_steps: {
        Row: {
          created_at: string
          employee_id: string
          id: string
          instruction: string
          output: string | null
          position: number
          status: string
          team_task_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          employee_id: string
          id?: string
          instruction: string
          output?: string | null
          position: number
          status?: string
          team_task_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          employee_id?: string
          id?: string
          instruction?: string
          output?: string | null
          position?: number
          status?: string
          team_task_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_task_steps_team_task_id_fkey"
            columns: ["team_task_id"]
            isOneToOne: false
            referencedRelation: "team_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_task_steps_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      team_tasks: {
        Row: {
          created_at: string
          final_output: string | null
          goal: string
          id: string
          status: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          final_output?: string | null
          goal: string
          id?: string
          status?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          final_output?: string | null
          goal?: string
          id?: string
          status?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_tasks_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      telegram_onboarding: {
        Row: {
          chat_id: string
          created_at: string
          data: Json
          step: string
          tg_name: string | null
          tg_username: string | null
          updated_at: string
        }
        Insert: {
          chat_id: string
          created_at?: string
          data?: Json
          step?: string
          tg_name?: string | null
          tg_username?: string | null
          updated_at?: string
        }
        Update: {
          chat_id?: string
          created_at?: string
          data?: Json
          step?: string
          tg_name?: string | null
          tg_username?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      tracked_keywords: {
        Row: {
          active: boolean
          country: string
          created_at: string
          domain: string
          id: string
          keyword: string
          last_checked_at: string | null
          market: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          active?: boolean
          country?: string
          created_at?: string
          domain: string
          id?: string
          keyword: string
          last_checked_at?: string | null
          market?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          active?: boolean
          country?: string
          created_at?: string
          domain?: string
          id?: string
          keyword?: string
          last_checked_at?: string | null
          market?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tracked_keywords_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      tracking_audits: {
        Row: {
          ad_account_id: string
          coverage: Json
          created_at: string
          findings: Json
          id: string
          limitations: Json
          platform: string
          score: number | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          ad_account_id: string
          coverage?: Json
          created_at?: string
          findings?: Json
          id?: string
          limitations?: Json
          platform: string
          score?: number | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          ad_account_id?: string
          coverage?: Json
          created_at?: string
          findings?: Json
          id?: string
          limitations?: Json
          platform?: string
          score?: number | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tracking_audits_ad_account_id_fkey"
            columns: ["ad_account_id"]
            isOneToOne: false
            referencedRelation: "ad_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tracking_audits_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      user_context_notes: {
        Row: {
          ad_account_id: string
          created_at: string
          id: string
          note: string
          period_end: string | null
          period_start: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          ad_account_id: string
          created_at?: string
          id?: string
          note: string
          period_end?: string | null
          period_start?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          ad_account_id?: string
          created_at?: string
          id?: string
          note?: string
          period_end?: string | null
          period_start?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_context_notes_ad_account_id_fkey"
            columns: ["ad_account_id"]
            isOneToOne: false
            referencedRelation: "ad_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_context_notes_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      user_notifications: {
        Row: {
          actor_id: string | null
          body: string
          created_at: string
          id: string
          kind: string
          read_at: string | null
          title: string
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          actor_id?: string | null
          body?: string
          created_at?: string
          id?: string
          kind: string
          read_at?: string | null
          title: string
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          actor_id?: string | null
          body?: string
          created_at?: string
          id?: string
          kind?: string
          read_at?: string | null
          title?: string
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_notifications_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_notifications_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      workspace_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          declined_at: string | null
          email: string
          expires_at: string
          id: string
          invited_by: string
          revoked_at: string | null
          role: string
          token_hash: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          declined_at?: string | null
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          revoked_at?: string | null
          role?: string
          token_hash: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          declined_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          revoked_at?: string | null
          role?: string
          token_hash?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_invitations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_members: {
        Row: {
          created_at: string
          role: string
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          role?: string
          updated_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          role?: string
          updated_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          archived_at: string | null
          banned_words: string[]
          country: string | null
          created_at: string
          id: string
          industry: string
          initials: string
          kind: string
          logo_url: string | null
          name: string
          owner_id: string
          profile: Json
          tone: string
          updated_at: string
          use_website_context: boolean
          website: string | null
        }
        Insert: {
          archived_at?: string | null
          banned_words?: string[]
          country?: string | null
          created_at?: string
          id?: string
          industry?: string
          initials?: string
          kind?: string
          logo_url?: string | null
          name: string
          owner_id: string
          profile?: Json
          tone?: string
          updated_at?: string
          use_website_context?: boolean
          website?: string | null
        }
        Update: {
          archived_at?: string | null
          banned_words?: string[]
          country?: string | null
          created_at?: string
          id?: string
          industry?: string
          initials?: string
          kind?: string
          logo_url?: string | null
          name?: string
          owner_id?: string
          profile?: Json
          tone?: string
          updated_at?: string
          use_website_context?: boolean
          website?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_workspace_invitation: {
        Args: { _token_hash: string }
        Returns: string
      }
      ads_baseline_page: {
        Args: {
          p_baseline_id: string
          p_job_id: string
          p_since: string
          p_today: string
          p_token: string
        }
        Returns: boolean
      }
      ads_checkpoint_job: {
        Args: {
          p_cursor: Json
          p_job_id: string
          p_lease_token: string
          p_pause_reason?: string
          p_progress: Json
          p_status: string
        }
        Returns: boolean
      }
      ads_claim_job: {
        Args: { p_account_id: string; p_job_id: string; p_workspace_id: string }
        Returns: {
          ad_account_id: string
          attempts: number
          created_at: string
          cursor: Json
          dedupe_key: string
          id: string
          kind: string
          last_error: string | null
          lease_expires_at: string | null
          lease_token: string | null
          next_attempt_at: string | null
          pause_reason: string | null
          progress: Json
          status: string
          updated_at: string
          workspace_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "ad_jobs"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      ads_claim_page_audit: {
        Args: {
          p_account_id: string
          p_page_id: string
          p_workspace_id: string
        }
        Returns: boolean
      }
      ads_is_admin: { Args: never; Returns: boolean }
      ads_mark_page_fix: {
        Args: {
          p_owner_id: string
          p_ticket_id: string
          p_workspace_id: string
        }
        Returns: boolean
      }
      ads_record_outcome: {
        Args: {
          p_account_id: string
          p_classification: string
          p_evaluation: Json
          p_learning: string
          p_outcome_id: string
          p_workspace_id: string
        }
        Returns: boolean
      }
      ads_review_recommendation: {
        Args: {
          p_decision: string
          p_expected_created_at: string
          p_id: string
          p_new_change?: Json
          p_owner_id: string
          p_review_at?: string
          p_success_metric?: string
          p_workspace_id: string
        }
        Returns: boolean
      }
      approve_mature_referral_commissions: { Args: never; Returns: number }
      bump_rate_limit: {
        Args: { _bucket: string; _identifier: string; _window_seconds: number }
        Returns: number
      }
      credit_referral_payment: {
        Args: {
          _currency?: string
          _gross_amount_cents: number
          _payment_reference: string
          _referred_user_id: string
        }
        Returns: string
      }
      get_shared_output: {
        Args: { _token: string }
        Returns: {
          body: string
          company: string
          created_at: string
          employee_id: string
          title: string
        }[]
      }
      match_knowledge: {
        Args: { _count?: number; _query: string; _workspace_id: string }
        Returns: {
          content: string
          id: string
          similarity: number
          source: string
          title: string
        }[]
      }
      owns_workspace: { Args: { _workspace_id: string }; Returns: boolean }
      referral_rate_for_active_count: {
        Args: { _active_count: number }
        Returns: number
      }
      request_referral_payout: {
        Args: { _destination: string; _method: string; _user_id: string }
        Returns: string
      }
      reverse_referral_payment: {
        Args: { _payment_reference: string; _reason: string }
        Returns: boolean
      }
      transfer_project_ownership: {
        Args: { _caller: string; _new_owner: string; _workspace_id: string }
        Returns: undefined
      }
      verify_cron_token: {
        Args: { _name: string; _token: string }
        Returns: boolean
      }
      workspace_for_email: {
        Args: { _email: string }
        Returns: {
          full_name: string
          user_id: string
          workspace_id: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
