// Authentication removed - app is now open access
export function useAuth() {
  return {
    user: null,
    isLoading: false,
    isAuthenticated: false,
  };
}
