// Auth is disabled - all users are authenticated locally
export function useAuth(_options?: any) {
  return {
    user: { id: 1, username: 'local' },
    isAuthenticated: true,
    loading: false,
    authLoading: false,
    logout: () => {},
  };
}
