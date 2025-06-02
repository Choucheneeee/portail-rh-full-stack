// auth.util.ts
export const getRoleFromToken = (): string | null => {
    try {
      // Check if running in browser environment
      if (typeof window === 'undefined') return null;
  
      // Get token from localStorage
      const token = localStorage.getItem('token');
  
      if (!token) {
        console.warn('No token found in localStorage');
        return null;
      }
  
      // Split and verify JWT structure
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) {
        console.error('Invalid JWT structure');
        return null;
      }
  
      // Decode payload with proper base64url handling
      const base64Url = tokenParts[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const decodedPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
  
      const payload = JSON.parse(decodedPayload);
  
      return payload.role || null;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  };