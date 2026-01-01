import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Environment variables in this context can be in process.env or import.meta.env (Vite standard).
// We check both to ensure the Supabase client initializes correctly.
const getEnv = (key: string): string => {
  // Check process.env first (Node-like/Standard runner)
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  // Check import.meta.env (Vite/ESM style)
  try {
    // We use a cast to any to bypass potential TypeScript errors in environments 
    // where import.meta.env is not defined in the type system.
    const metaEnv = (import.meta as any).env;
    if (metaEnv && metaEnv[key]) {
      return metaEnv[key];
    }
  } catch (e) {
    // import.meta.env may not be accessible in all contexts
  }
  return '';
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY');

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Supabase configuration missing (VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY). " +
    "Check your environment variables."
  );
}

// Initialize the client. We use a placeholder if variables are missing to 
// avoid the 'supabaseUrl is required' exception that breaks the entire app load.
export const supabase = createClient(
  supabaseUrl || 'https://missing-configuration.supabase.co',
  supabaseAnonKey || 'missing-configuration-key'
);
