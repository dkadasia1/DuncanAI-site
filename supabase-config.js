// =========================================
// DuncanAI Supabase Configuration
// =========================================

const SUPABASE_URL =
  "https://ipqljhgaoyqifgrhehf.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_3YaQFqnWC4FFbuMz6xmNuw_H5VDjBq2";

window.supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
  );
