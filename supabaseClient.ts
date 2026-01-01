
// This file is no longer used. Logic has been moved to browser LocalStorage 
// to ensure the app works correctly without external configuration.
export const supabase = {
  auth: {
    getSession: async () => ({ data: { session: null } }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signInWithOAuth: () => {},
    signOut: () => {}
  }
};
