/*
  Supabase `Database` type mapping for TypeScript projects using
  @supabase/supabase-js. Adjust the schema to match your actual DB.

  This file declares a `Database` interface with `public` schema and
  `profiles` table Row / Insert / Update types. Import it into
  your Supabase client generic: `createClient<Database>(...)` to get
  type-safe queries.
*/

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string; // uuid
          user_id: string; // references auth.users(id)
          full_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          // ISO date string (YYYY-MM-DD or full ISO timestamp)
          birthday: string | null;
          // ISO date string (YYYY-MM-DD or full ISO timestamp)
          anniversary: string | null;
          special_events: Array<{ name: string; date: string }> | null;
          music_style: string | null;
          maya_interests: string[] | null;
          opt_in_magic: boolean | null;
          magic_profile: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          full_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          birthday?: string | null;
          anniversary?: string | null;
          special_events?: Array<{ name: string; date: string }> | null;
          music_style?: string | null;
          maya_interests?: string[] | null;
          opt_in_magic?: boolean | null;
          magic_profile?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          birthday?: string | null;
          anniversary?: string | null;
          special_events?: Array<{ name: string; date: string }> | null;
          music_style?: string | null;
          maya_interests?: string[] | null;
          opt_in_magic?: boolean | null;
          magic_profile?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      // Add other tables here as needed
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
