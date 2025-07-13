// User service for Supabase integration
// Replaces functions from /data/mock-users.ts

import { createClient } from '@/utils/supabase/client';

// Type definitions matching Supabase schema
export interface DatabaseUser {
  id: string;
  first_name: string;
  last_name: string;
  display_name: string;
  email: string;
  user_type: 'client' | 'mua' | 'muse' | 'admin';
  status: 'online' | 'offline' | 'connecting' | 'available' | 'busy';
  image_url?: string;
  expertise?: string;
  location?: string;
  clients_reached: number;
  projects_completed: number;
  instagram_followers?: string;
  instagram_handle?: string;
  is_available: boolean;
  last_active?: string;
  bio?: string;
  created_at: string;
  updated_at: string;
}

export interface MuseCharacteristics {
  id: string;
  user_id: string;
  height?: string;
  bust?: string;
  waist?: string;
  hips?: string;
  shoes?: string;
  suit?: string;
  hair_color?: string;
  eye_color?: string;
  ethnicity?: string;
  eye_type?: string;
  nose_type?: string;
  lip_type?: string;
  brow_type?: string;
  eyelid_type?: string;
}

export interface MuaPortfolio {
  id: string;
  user_id: string;
  tagline?: string;
  specialties?: string[];
  price_range?: string;
  years_experience: number;
  certifications?: string[];
  products_used?: string[];
  website_url?: string;
}

export interface BeforeAfterImage {
  id: string;
  portfolio_id: string;
  before_image_url: string;
  after_image_url: string;
  category: string;
  description?: string;
  display_order: number;
}

export interface MuaService {
  id: string;
  portfolio_id: string;
  name: string;
  description?: string;
  price?: string;
  duration?: string;
  is_featured: boolean;
  display_order: number;
}

export interface MuaTestimonial {
  id: string;
  portfolio_id: string;
  client_name: string;
  rating: number;
  review: string;
  event?: string;
  client_image_url?: string;
  is_featured: boolean;
}

// Complete user profile type (combines all data)
export interface CompleteUserProfile extends DatabaseUser {
  // MUSE characteristics
  characteristics?: MuseCharacteristics;
  // MUA portfolio
  muaPortfolio?: MuaPortfolio & {
    beforeAfterImages?: BeforeAfterImage[];
    services?: MuaService[];
    testimonials?: MuaTestimonial[];
  };
}

class UserService {
  private supabase = createClient();

  // Get all users with their complete profiles
  async getAllUsers(): Promise<CompleteUserProfile[]> {
    try {
      const { data: users, error } = await this.supabase
        .from('user_profiles') // Using the view we created
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return users || [];
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  }

  // Get user by ID with complete profile
  async getUserById(id: string): Promise<CompleteUserProfile | null> {
    try {
      // Get basic user data
      const { data: user, error: userError } = await this.supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      if (userError || !user) {
        console.error('Error fetching user:', userError);
        return null;
      }

      const profile: CompleteUserProfile = user;

      // Get MUSE characteristics if user is MUSE
      if (user.user_type === 'muse') {
        const { data: characteristics } = await this.supabase
          .from('muse_characteristics')
          .select('*')
          .eq('user_id', id)
          .single();

        if (characteristics) {
          profile.characteristics = characteristics;
        }
      }

      // Get MUA portfolio if user is MUA
      if (user.user_type === 'mua') {
        const { data: portfolio } = await this.supabase
          .from('mua_portfolios')
          .select('*')
          .eq('user_id', id)
          .single();

        if (portfolio) {
          // Get before/after images
          const { data: beforeAfterImages } = await this.supabase
            .from('mua_before_after_images')
            .select('*')
            .eq('portfolio_id', portfolio.id)
            .order('display_order');

          // Get services
          const { data: services } = await this.supabase
            .from('mua_services')
            .select('*')
            .eq('portfolio_id', portfolio.id)
            .order('display_order');

          // Get testimonials
          const { data: testimonials } = await this.supabase
            .from('mua_testimonials')
            .select('*')
            .eq('portfolio_id', portfolio.id)
            .order('created_at', { ascending: false });

          profile.muaPortfolio = {
            ...portfolio,
            beforeAfterImages: beforeAfterImages || [],
            services: services || [],
            testimonials: testimonials || []
          };
        }
      }

      return profile;
    } catch (error) {
      console.error('Error fetching user by ID:', error);
      return null;
    }
  }

  // Search users by query
  async searchUsers(query: string): Promise<CompleteUserProfile[]> {
    try {
      const { data: users, error } = await this.supabase
        .from('users')
        .select('*')
        .or(`display_name.ilike.%${query}%,expertise.ilike.%${query}%,location.ilike.%${query}%`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return users || [];
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  }

  // Get users by expertise/type
  async getUsersByType(userType: 'mua' | 'muse'): Promise<CompleteUserProfile[]> {
    try {
      const { data: users, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('user_type', userType)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return users || [];
    } catch (error) {
      console.error('Error fetching users by type:', error);
      return [];
    }
  }

  // Filter users with advanced criteria
  async filterUsers(filters: {
    expertise?: string;
    priceRange?: string;
    level?: string;
    location?: string;
    searchQuery?: string;
  }): Promise<CompleteUserProfile[]> {
    try {
      let query = this.supabase.from('users').select('*');

      // Apply filters
      if (filters.expertise && filters.expertise !== 'Semua Expertise') {
        query = query.eq('user_type', filters.expertise.toLowerCase());
      }

      if (filters.location && filters.location !== 'Semua Lokasi') {
        query = query.eq('location', filters.location);
      }

      if (filters.searchQuery) {
        query = query.or(`display_name.ilike.%${filters.searchQuery}%,expertise.ilike.%${filters.searchQuery}%,location.ilike.%${filters.searchQuery}%`);
      }

      // Add price range and level filtering logic here if needed
      // This would require joining with MUA portfolios for price ranges

      const { data: users, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return users || [];
    } catch (error) {
      console.error('Error filtering users:', error);
      return [];
    }
  }

  // Get available users
  async getAvailableUsers(): Promise<CompleteUserProfile[]> {
    try {
      const { data: users, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('is_available', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return users || [];
    } catch (error) {
      console.error('Error fetching available users:', error);
      return [];
    }
  }

  // Get users by status
  async getUsersByStatus(status: DatabaseUser['status']): Promise<CompleteUserProfile[]> {
    try {
      const { data: users, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('status', status)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return users || [];
    } catch (error) {
      console.error('Error fetching users by status:', error);
      return [];
    }
  }

  // Helper function to get user category (MUA/MUSE/CLIENT)
  getUserCategory(user: CompleteUserProfile): string {
    if (user.user_type === 'mua') return 'MUA';
    if (user.user_type === 'muse') return 'MUSE';
    return 'CLIENT';
  }

  // Helper function to calculate conversion rate
  getConversionRate(user: CompleteUserProfile): number {
    if (user.clients_reached === 0) return 0;
    return Math.round((user.projects_completed / user.clients_reached) * 100);
  }

  // Status color helper (matches mock-users.ts)
  getStatusColor(status: DatabaseUser['status']): string {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'connecting': return 'bg-blue-500';
      case 'available': return 'bg-green-400';
      case 'busy': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  }

  // Status text helper
  getStatusText(status: DatabaseUser['status']): string {
    switch (status) {
      case 'online': return 'Online';
      case 'connecting': return 'Menghubungkan';
      case 'available': return 'Tersedia';
      case 'busy': return 'Sibuk';
      case 'offline': return 'Offline';
      default: return 'Tidak Diketahui';
    }
  }

  // Get user price range (for MUA users)
  getUserPriceRange(user: CompleteUserProfile): string {
    if (user.muaPortfolio?.price_range) {
      return user.muaPortfolio.price_range;
    }
    
    // Fallback based on expertise
    const expertise = user.expertise || '';
    if (expertise.includes('Ahli') || expertise.includes('Direktur')) {
      return 'Di atas 1jt';
    } else if (expertise.includes('Profesional') || expertise.includes('Senior')) {
      return '500k - 1jt';
    } else if (expertise.includes('Bersertifikat') || expertise.includes('Spesialis')) {
      return '200k - 500k';
    } else {
      return 'Di bawah 200k';
    }
  }

  // Get user level based on expertise
  getUserLevel(user: CompleteUserProfile): string {
    const expertise = user.expertise || '';
    if (expertise.includes('Ahli') || expertise.includes('Direktur')) {
      return 'Ahli';
    } else if (expertise.includes('Profesional') || expertise.includes('Senior')) {
      return 'Profesional';
    } else if (expertise.includes('Bersertifikat') || expertise.includes('Spesialis')) {
      return 'Menengah';
    } else {
      return 'Pemula';
    }
  }

  // Update user profile
  async updateUserProfile(id: string, updates: Partial<DatabaseUser>): Promise<CompleteUserProfile | null> {
    try {
      const { data: user, error } = await this.supabase
        .from('users')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return user;
    } catch (error) {
      console.error('Error updating user profile:', error);
      return null;
    }
  }

  // Create new user
  async createUser(userData: Omit<DatabaseUser, 'id' | 'created_at' | 'updated_at'>): Promise<CompleteUserProfile | null> {
    try {
      const { data: user, error } = await this.supabase
        .from('users')
        .insert(userData)
        .select()
        .single();

      if (error) throw error;
      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      return null;
    }
  }
}

// Export singleton instance
export const userService = new UserService();

// Export constants that were in mock-users.ts
export const expertiseTypes = ["MUA", "MUSE"];

export const priceRanges = [
  "Semua Harga",
  "Di bawah 200k",
  "200k - 500k", 
  "500k - 1jt",
  "Di atas 1jt"
];

export const levelTypes = [
  "Semua Level",
  "Pemula",
  "Menengah", 
  "Ahli",
  "Profesional"
];

export const locationTypes = [
  "Semua Lokasi",
  "Jakarta",
  "Bandung",
  "Surabaya", 
  "Yogyakarta",
  "Bali",
  "Medan",
  "Semarang",
  "Malang",
  "Makassar",
  "Palembang",
  "Denpasar",
  "Batam"
];

// Compatibility functions (to match mock-users.ts exports)
export const getUserById = (id: string) => userService.getUserById(id);
export const searchUsers = (query: string) => userService.searchUsers(query);
export const getUsersByExpertise = (expertise: string) => userService.getUsersByType(expertise as 'mua' | 'muse');
export const filterUsers = (filters: any) => userService.filterUsers(filters);
export const getAvailableUsers = () => userService.getAvailableUsers();
export const getUsersByStatus = (status: any) => userService.getUsersByStatus(status);
export const getUserCategory = (user: any) => userService.getUserCategory(user);
export const getConversionRate = (user: any) => userService.getConversionRate(user);
export const getStatusColor = (status: any) => userService.getStatusColor(status);
export const getStatusText = (status: any) => userService.getStatusText(status);
export const getUserPriceRange = (user: any) => userService.getUserPriceRange(user);
export const getUserLevel = (user: any) => userService.getUserLevel(user);

// Type alias for backward compatibility
export type MockUser = CompleteUserProfile;