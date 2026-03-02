import { createClient } from "@supabase/supabase-js";
import config from "./environment";

export const supabaseAdmin = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export const supabaseAnon = createClient(
  config.supabase.url,
  config.supabase.anonKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Re-export shared types from the single source of truth.
export type { JwtPayload, UserProfile } from "../types";
