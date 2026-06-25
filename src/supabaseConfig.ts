/**
 * Supabase connection config.
 *
 * The publishable key (`sb_publishable_…`) is designed to be used in the
 * browser and ends up in the built JS regardless, so it is committed here as
 * the default — that lets the deployed app sync on any host without extra
 * setup. Override either value with the VITE_SUPABASE_URL /
 * VITE_SUPABASE_ANON_KEY environment variables (e.g. in Netlify), and rotate
 * the key anytime in the Supabase dashboard (Settings → API Keys).
 */
export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ?? 'https://dlwdlphfuawhgxtxbwtj.supabase.co';

export const SUPABASE_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  'sb_publishable_uCpYC2B6SgL-0EwH54v9SA_CKPWBfsO';
