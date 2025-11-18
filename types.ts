export type Role = 'admin' | 'sales';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar: string;
}

export enum LeadStatus {
  New = 'ใหม่',
  Uncalled = 'ยังไม่ได้โทร',
  Contacted = 'ติดต่อแล้ว',
  FollowUp = 'ติดตามผล',
  Won = 'สำเร็จ',
  Lost = 'ยกเลิก',
}

export type Lead = Database['public']['Tables']['leads']['Row'] & {
  profiles: { full_name: string } | null;
};
export type Salesperson = Database['public']['Tables']['profiles']['Row'];
export type CalendarEvent = Database['public']['Tables']['calendar_events']['Row'];
export type LeadActivity = Database['public']['Tables']['lead_activities']['Row'];


export type Page = 'admin-dashboard' | 'sales-dashboard' | 'leads' | 'team' | 'calendar' | 'settings';

export interface ToastMessage {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

export interface ConnectionTestResult {
    test: string;
    status: 'pending' | 'success' | 'failure' | 'info';
    details: string;
    fix?: string;
}

// --- Supabase-generated types ---
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      calendar_events: {
        Row: {
          created_at: string
          end_time: string
          id: number
          lead_id: number | null
          salesperson_id: string
          start_time: string
          title: string
        }
        Insert: {
          created_at?: string
          end_time: string
          id?: number
          lead_id?: number | null
          salesperson_id: string
          start_time: string
          title: string
        }
        Update: {
          created_at?: string
          end_time?: string
          id?: number
          lead_id?: number | null
          salesperson_id?: string
          start_time?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_salesperson_id_fkey"
            columns: ["salesperson_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_activities: {
        Row: {
          activity_description: string
          created_at: string
          id: number
          lead_id: number
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          activity_description: string
          created_at?: string
          id?: number
          lead_id: number
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          activity_description?: string
          created_at?: string
          id?: number
          lead_id?: number
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_activities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          address: string | null
          assigned_to: string | null
          birthday: string | null
          created_at: string
          id: number
          last_update_date: string | null
          name: string
          notes: string | null
          phone: string
          program: string | null
          received_date: string
          status: Database["public"]["Enums"]["lead_status"]
          value: number | null
        }
        Insert: {
          address?: string | null
          assigned_to?: string | null
          birthday?: string | null
          created_at?: string
          id?: number
          last_update_date?: string | null
          name: string
          notes?: string | null
          phone: string
          program?: string | null
          received_date?: string
          status?: Database["public"]["Enums"]["lead_status"]
          value?: number | null
        }
        Update: {
          address?: string | null
          assigned_to?: string | null
          birthday?: string | null
          created_at?: string
          id?: number
          last_update_date?: string | null
          name?: string
          notes?: string | null
          phone?: string
          program?: string | null
          received_date?: string
          status?: Database["public"]["Enums"]["lead_status"]
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          email: string | null
          full_name: string | null
          id: string
          role: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          role?: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          role?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_create_user: {
        Args: {
          email_input: string
          password_input: string
          full_name_input: string
          role_input: string
        }
        Returns: string
      }
      get_my_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      update_user_password: {
        Args: {
          user_id: string
          new_password: string
        }
        Returns: undefined
      }
    }
    Enums: {
      lead_status:
        | "ใหม่"
        | "ยังไม่ได้โทร"
        | "ติดต่อแล้ว"
        | "ติดตามผล"
        | "สำเร็จ"
        | "ยกเลิก"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}