export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Enum types
export type AppRole = 'admin' | 'moderator' | 'user';
export type AdPlatform = 'meta' | 'google';
export type ConnectionStatus = 'connected' | 'disconnected' | 'expired' | 'error';
export type ReportFrequency = 'daily' | 'weekly' | 'monthly' | 'custom';
export type ReportPeriod = 'today' | 'yesterday' | 'last_7_days' | 'last_30_days' | 'this_month' | 'last_month' | 'custom';
export type AlertType = 'balance' | 'error' | 'performance';
export type TemplateType = 'report' | 'alert';
export type SubscriptionStatus = 'active' | 'inactive' | 'cancelled' | 'past_due';

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          logo_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          logo_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          logo_url?: string | null;
          updated_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          phone?: string | null;
          updated_at?: string;
        };
      };
      organization_users: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          organization_id?: string;
          user_id?: string;
        };
      };
      user_roles: {
        Row: {
          id: string;
          user_id: string;
          role: AppRole;
        };
        Insert: {
          id?: string;
          user_id: string;
          role: AppRole;
        };
        Update: {
          user_id?: string;
          role?: AppRole;
        };
      };
      clients: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          email: string | null;
          phone: string | null;
          company: string | null;
          avatar_url: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          email?: string | null;
          phone?: string | null;
          company?: string | null;
          avatar_url?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          email?: string | null;
          phone?: string | null;
          company?: string | null;
          avatar_url?: string | null;
          is_active?: boolean;
          updated_at?: string;
        };
      };
      ad_connections: {
        Row: {
          id: string;
          organization_id: string;
          platform: AdPlatform;
          name: string;
          status: ConnectionStatus;
          access_token: string | null;
          refresh_token: string | null;
          expires_at: string | null;
          metadata: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          platform: AdPlatform;
          name: string;
          status?: ConnectionStatus;
          access_token?: string | null;
          refresh_token?: string | null;
          expires_at?: string | null;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          platform?: AdPlatform;
          name?: string;
          status?: ConnectionStatus;
          access_token?: string | null;
          refresh_token?: string | null;
          expires_at?: string | null;
          metadata?: Json | null;
          updated_at?: string;
        };
      };
      ad_accounts: {
        Row: {
          id: string;
          connection_id: string;
          organization_id: string;
          account_id: string;
          name: string;
          currency: string;
          timezone: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          connection_id: string;
          organization_id: string;
          account_id: string;
          name: string;
          currency?: string;
          timezone?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          account_id?: string;
          name?: string;
          currency?: string;
          timezone?: string | null;
          is_active?: boolean;
          updated_at?: string;
        };
      };
      whatsapp_accounts: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          phone_number: string;
          status: ConnectionStatus;
          is_default: boolean;
          api_key: string | null;
          metadata: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          phone_number: string;
          status?: ConnectionStatus;
          is_default?: boolean;
          api_key?: string | null;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          phone_number?: string;
          status?: ConnectionStatus;
          is_default?: boolean;
          api_key?: string | null;
          metadata?: Json | null;
          updated_at?: string;
        };
      };
      reports: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          frequency: ReportFrequency;
          schedule_time: string;
          schedule_days: number[] | null;
          period: ReportPeriod;
          whatsapp_account_id: string | null;
          recipient_phone: string | null;
          recipient_group_id: string | null;
          is_active: boolean;
          last_sent_at: string | null;
          next_send_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          frequency?: ReportFrequency;
          schedule_time?: string;
          schedule_days?: number[] | null;
          period?: ReportPeriod;
          whatsapp_account_id?: string | null;
          recipient_phone?: string | null;
          recipient_group_id?: string | null;
          is_active?: boolean;
          last_sent_at?: string | null;
          next_send_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          frequency?: ReportFrequency;
          schedule_time?: string;
          schedule_days?: number[] | null;
          period?: ReportPeriod;
          whatsapp_account_id?: string | null;
          recipient_phone?: string | null;
          recipient_group_id?: string | null;
          is_active?: boolean;
          last_sent_at?: string | null;
          next_send_at?: string | null;
          updated_at?: string;
        };
      };
      report_ad_accounts: {
        Row: {
          id: string;
          report_id: string;
          ad_account_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          report_id: string;
          ad_account_id: string;
          created_at?: string;
        };
        Update: {
          report_id?: string;
          ad_account_id?: string;
        };
      };
      message_templates: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          type: TemplateType;
          content: string;
          report_id: string | null;
          alert_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          type: TemplateType;
          content: string;
          report_id?: string | null;
          alert_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          type?: TemplateType;
          content?: string;
          report_id?: string | null;
          alert_id?: string | null;
          updated_at?: string;
        };
      };
      template_variables: {
        Row: {
          id: string;
          name: string;
          tag: string;
          description: string | null;
          platform: AdPlatform | null;
          category: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          tag: string;
          description?: string | null;
          platform?: AdPlatform | null;
          category?: string | null;
          created_at?: string;
        };
        Update: {
          name?: string;
          tag?: string;
          description?: string | null;
          platform?: AdPlatform | null;
          category?: string | null;
        };
      };
      alerts: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          type: AlertType;
          ad_account_id: string | null;
          threshold_value: number | null;
          whatsapp_account_id: string | null;
          recipient_phone: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          type: AlertType;
          ad_account_id?: string | null;
          threshold_value?: number | null;
          whatsapp_account_id?: string | null;
          recipient_phone?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          type?: AlertType;
          ad_account_id?: string | null;
          threshold_value?: number | null;
          whatsapp_account_id?: string | null;
          recipient_phone?: string | null;
          is_active?: boolean;
          updated_at?: string;
        };
      };
      ad_metrics_snapshots: {
        Row: {
          id: string;
          organization_id: string;
          ad_account_id: string;
          date: string;
          metrics: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          ad_account_id: string;
          date: string;
          metrics: Json;
          created_at?: string;
        };
        Update: {
          date?: string;
          metrics?: Json;
        };
      };
      report_runs: {
        Row: {
          id: string;
          report_id: string;
          status: 'pending' | 'success' | 'error';
          error_message: string | null;
          metrics_snapshot: Json | null;
          sent_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          report_id: string;
          status?: 'pending' | 'success' | 'error';
          error_message?: string | null;
          metrics_snapshot?: Json | null;
          sent_at?: string | null;
          created_at?: string;
        };
        Update: {
          status?: 'pending' | 'success' | 'error';
          error_message?: string | null;
          metrics_snapshot?: Json | null;
          sent_at?: string | null;
        };
      };
      alert_runs: {
        Row: {
          id: string;
          alert_id: string;
          status: 'pending' | 'success' | 'error';
          error_message: string | null;
          triggered_value: number | null;
          sent_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          alert_id: string;
          status?: 'pending' | 'success' | 'error';
          error_message?: string | null;
          triggered_value?: number | null;
          sent_at?: string | null;
          created_at?: string;
        };
        Update: {
          status?: 'pending' | 'success' | 'error';
          error_message?: string | null;
          triggered_value?: number | null;
          sent_at?: string | null;
        };
      };
      notifications: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string | null;
          title: string;
          message: string;
          type: 'info' | 'warning' | 'error' | 'success';
          metadata: Json | null;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id?: string | null;
          title: string;
          message: string;
          type?: 'info' | 'warning' | 'error' | 'success';
          metadata?: Json | null;
          read_at?: string | null;
          created_at?: string;
        };
        Update: {
          title?: string;
          message?: string;
          type?: 'info' | 'warning' | 'error' | 'success';
          metadata?: Json | null;
          read_at?: string | null;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          organization_id: string;
          plan_id: string;
          status: SubscriptionStatus;
          current_period_start: string;
          current_period_end: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          plan_id: string;
          status?: SubscriptionStatus;
          current_period_start: string;
          current_period_end: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          plan_id?: string;
          status?: SubscriptionStatus;
          current_period_start?: string;
          current_period_end?: string;
          updated_at?: string;
        };
      };
      plans: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          price_monthly: number;
          price_yearly: number | null;
          max_reports: number;
          max_alerts: number;
          max_clients: number;
          max_connections: number;
          features: Json | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          price_monthly: number;
          price_yearly?: number | null;
          max_reports?: number;
          max_alerts?: number;
          max_clients?: number;
          max_connections?: number;
          features?: Json | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          description?: string | null;
          price_monthly?: number;
          price_yearly?: number | null;
          max_reports?: number;
          max_alerts?: number;
          max_clients?: number;
          max_connections?: number;
          features?: Json | null;
          is_active?: boolean;
          updated_at?: string;
        };
      };
      campaigns: {
        Row: {
          id: string;
          account_id: string;
          campaign_id: string;
          name: string;
          status: string;
          objective: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          account_id: string;
          campaign_id: string;
          name: string;
          status?: string;
          objective?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          account_id?: string;
          campaign_id?: string;
          name?: string;
          status?: string;
          objective?: string | null;
          updated_at?: string;
        };
      };
      daily_metrics: {
        Row: {
          id: string;
          campaign_id: string;
          date: string;
          spend: number;
          impressions: number;
          clicks: number;
          leads: number;
          purchases: number;
          revenue: number;
          video_plays: number;
          cpc: number;
          cpm: number;
          ctr: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          campaign_id: string;
          date: string;
          spend?: number;
          impressions?: number;
          clicks?: number;
          leads?: number;
          purchases?: number;
          revenue?: number;
          video_plays?: number;
          cpc?: number;
          cpm?: number;
          ctr?: number;
          created_at?: string;
        };
        Update: {
          campaign_id?: string;
          date?: string;
          spend?: number;
          impressions?: number;
          clicks?: number;
          leads?: number;
          purchases?: number;
          revenue?: number;
          video_plays?: number;
          cpc?: number;
          cpm?: number;
          ctr?: number;
        };
      };
    };
    Functions: {
      has_role: {
        Args: { _user_id: string; _role: AppRole };
        Returns: boolean;
      };
    };
  };
}

// Helper types for easier usage
export type Organization = Database['public']['Tables']['organizations']['Row'];
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type OrganizationUser = Database['public']['Tables']['organization_users']['Row'];
export type UserRole = Database['public']['Tables']['user_roles']['Row'];
export type Client = Database['public']['Tables']['clients']['Row'];
export type AdConnection = Database['public']['Tables']['ad_connections']['Row'];
export type AdAccount = Database['public']['Tables']['ad_accounts']['Row'];
export type WhatsappAccount = Database['public']['Tables']['whatsapp_accounts']['Row'];
export type Report = Database['public']['Tables']['reports']['Row'];
export type ReportAdAccount = Database['public']['Tables']['report_ad_accounts']['Row'];
export type MessageTemplate = Database['public']['Tables']['message_templates']['Row'];
export type TemplateVariable = Database['public']['Tables']['template_variables']['Row'];
export type Alert = Database['public']['Tables']['alerts']['Row'];
export type AdMetricsSnapshot = Database['public']['Tables']['ad_metrics_snapshots']['Row'];
export type ReportRun = Database['public']['Tables']['report_runs']['Row'];
export type AlertRun = Database['public']['Tables']['alert_runs']['Row'];
export type Notification = Database['public']['Tables']['notifications']['Row'];
export type Subscription = Database['public']['Tables']['subscriptions']['Row'];
export type Plan = Database['public']['Tables']['plans']['Row'];
export type Campaign = Database['public']['Tables']['campaigns']['Row'];
export type DailyMetric = Database['public']['Tables']['daily_metrics']['Row'];

// Metrics type
export interface AdMetrics {
  spend: number;
  impressions: number;
  clicks: number;
  cpc: number;
  ctr: number;
  conversions: number;
  cost_per_conversion: number;
  reach?: number;
}
