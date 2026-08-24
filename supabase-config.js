// =========================================
// DuncanAI Supabase Configuration
// =========================================

const SUPABASE_URL =
  "https://lpiqljhgaoyqifgrhehf.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_3YaQFqnWC4FFbuMz6xmNuw_H5VDjBq2";

const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
  );
