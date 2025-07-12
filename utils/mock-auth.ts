// Mock authentication system to replace Supabase auth
// Simple implementation for template/UI development

export interface MockAuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  userType: 'client' | 'streamer' | 'admin';
  profilePicture?: string;
  location?: string;
}

// Mock current user - you can change this to test different user types
const MOCK_CURRENT_USER: MockAuthUser = {
  id: 'mock-user-1',
  email: 'demo@example.com',
  firstName: 'Demo',
  lastName: 'User',
  userType: 'client',
  profilePicture: '/images/profile1.jpg',
  location: 'Jakarta'
};

// Simple in-memory auth state
let currentUser: MockAuthUser | null = MOCK_CURRENT_USER;
let isAuthenticated = true;

export class MockAuth {
  // Get current user
  static getCurrentUser(): MockAuthUser | null {
    return currentUser;
  }

  // Check if user is authenticated
  static isAuthenticated(): boolean {
    return isAuthenticated && currentUser !== null;
  }

  // Mock login (always succeeds for demo)
  static async login(email: string, password: string): Promise<{ user: MockAuthUser | null; error: string | null }> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock success
    currentUser = MOCK_CURRENT_USER;
    isAuthenticated = true;
    
    return { user: currentUser, error: null };
  }

  // Mock logout
  static async logout(): Promise<void> {
    currentUser = null;
    isAuthenticated = false;
  }

  // Mock registration
  static async register(userData: Partial<MockAuthUser>): Promise<{ user: MockAuthUser | null; error: string | null }> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const newUser: MockAuthUser = {
      id: 'mock-user-' + Date.now(),
      email: userData.email || 'user@example.com',
      firstName: userData.firstName || 'New',
      lastName: userData.lastName || 'User',
      userType: userData.userType || 'client',
      profilePicture: userData.profilePicture,
      location: userData.location
    };
    
    currentUser = newUser;
    isAuthenticated = true;
    
    return { user: newUser, error: null };
  }

  // Get user profile data
  static async getUserProfile(userId: string): Promise<MockAuthUser | null> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (currentUser && currentUser.id === userId) {
      return currentUser;
    }
    
    return null;
  }

  // Update user profile
  static async updateUserProfile(userData: Partial<MockAuthUser>): Promise<{ user: MockAuthUser | null; error: string | null }> {
    if (!currentUser) {
      return { user: null, error: 'Not authenticated' };
    }
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    currentUser = { ...currentUser, ...userData };
    return { user: currentUser, error: null };
  }

  // Check user access level
  static hasAccess(requiredUserType: 'client' | 'streamer' | 'admin'): boolean {
    if (!isAuthenticated || !currentUser) return false;
    
    // Admin has access to everything
    if (currentUser.userType === 'admin') return true;
    
    // Otherwise check exact match
    return currentUser.userType === requiredUserType;
  }

  // Redirect helpers for protected routes
  static getRedirectPath(userType: string): string {
    switch (userType) {
      case 'client':
        return '/protected';
      case 'streamer':
        return '/streamer-dashboard';
      case 'admin':
        return '/admin';
      default:
        return '/sign-in';
    }
  }
}

// Hook-like function for React components
export const useMockAuth = () => {
  return {
    user: MockAuth.getCurrentUser(),
    isAuthenticated: MockAuth.isAuthenticated(),
    login: MockAuth.login,
    logout: MockAuth.logout,
    register: MockAuth.register,
    hasAccess: MockAuth.hasAccess
  };
};

// Helper function to simulate Supabase-like auth response
export const createMockAuthResponse = () => {
  return {
    data: {
      user: MockAuth.getCurrentUser()
    },
    error: null
  };
};