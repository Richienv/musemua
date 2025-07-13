// Database type definitions for Supabase integration
// Matches the schema created in supabase-schema.sql

export type UserStatus = 'online' | 'offline' | 'connecting' | 'available' | 'busy';
export type UserType = 'client' | 'mua' | 'muse' | 'admin';
export type CollaborationStatus = 'pending' | 'accepted' | 'declined' | 'counter_offered' | 'in_progress' | 'completed';
export type UrgencyLevel = 'normal' | 'urgent' | 'flexible';
export type DiscountType = 'percentage' | 'fixed';
export type VoucherStatus = 'active' | 'expired' | 'depleted';

// Core user interface
export interface DatabaseUser {
  id: string;
  auth_user_id?: string;
  first_name: string;
  last_name: string;
  display_name: string;
  email: string;
  phone?: string;
  user_type: UserType;
  status: UserStatus;
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

// MUSE characteristics
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
  created_at: string;
  updated_at: string;
}

// MUA portfolio
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
  created_at: string;
  updated_at: string;
}

// MUA before/after images
export interface MuaBeforeAfterImage {
  id: string;
  portfolio_id: string;
  before_image_url: string;
  after_image_url: string;
  category: string;
  description?: string;
  display_order: number;
  created_at: string;
}

// MUA services
export interface MuaService {
  id: string;
  portfolio_id: string;
  name: string;
  description?: string;
  price?: string;
  duration?: string;
  is_featured: boolean;
  display_order: number;
  created_at: string;
}

// MUA testimonials
export interface MuaTestimonial {
  id: string;
  portfolio_id: string;
  client_name: string;
  rating: number;
  review: string;
  event?: string;
  client_image_url?: string;
  is_featured: boolean;
  created_at: string;
}

// Collaboration requests
export interface CollaborationRequest {
  id: string;
  client_id: string;
  mua_id: string;
  project_type: string;
  budget_range?: string;
  custom_budget?: string;
  timeline?: string;
  urgency: UrgencyLevel;
  description: string;
  requirements?: string;
  client_name: string;
  client_email: string;
  client_phone?: string;
  client_company?: string;
  status: CollaborationStatus;
  response_deadline?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Portfolio images (general)
export interface PortfolioImage {
  id: string;
  user_id: string;
  image_url: string;
  caption?: string;
  category?: string;
  is_featured: boolean;
  display_order: number;
  created_at: string;
}

// Vouchers
export interface Voucher {
  id: string;
  code: string;
  discount_type: DiscountType;
  discount_value: number;
  max_usage: number;
  current_usage: number;
  start_date: string;
  end_date: string;
  status: VoucherStatus;
  created_at: string;
  updated_at: string;
}

// Notifications
export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  action_url?: string;
  created_at: string;
}

// Messages
export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  collaboration_request_id?: string;
  subject?: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

// Bookings
export interface Booking {
  id: string;
  client_id: string;
  provider_id: string;
  collaboration_request_id?: string;
  service_type: string;
  scheduled_date: string;
  duration_hours?: number;
  total_amount?: number;
  status: string;
  payment_status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Payments
export interface Payment {
  id: string;
  booking_id: string;
  user_id: string;
  amount: number;
  currency: string;
  payment_method?: string;
  payment_provider?: string;
  provider_transaction_id?: string;
  status: string;
  voucher_id?: string;
  discount_amount: number;
  final_amount: number;
  created_at: string;
  updated_at: string;
}

// Complete user profile (combines all related data)
export interface CompleteUserProfile extends DatabaseUser {
  // MUSE characteristics
  characteristics?: MuseCharacteristics;
  
  // MUA portfolio with related data
  muaPortfolio?: MuaPortfolio & {
    beforeAfterImages?: MuaBeforeAfterImage[];
    services?: MuaService[];
    testimonials?: MuaTestimonial[];
  };
  
  // Portfolio images
  portfolioImages?: PortfolioImage[];
  
  // Computed fields
  user_category?: 'MUA' | 'MUSE' | 'CLIENT';
  conversion_rate?: number;
}

// Extended collaboration request with user profiles
export interface CollaborationRequestWithProfiles extends CollaborationRequest {
  client_display_name?: string;
  client_image_url?: string;
  mua_display_name?: string;
  mua_image_url?: string;
}

// Database response types
export interface DatabaseResponse<T> {
  data: T | null;
  error: Error | null;
}

export interface DatabaseListResponse<T> {
  data: T[] | null;
  error: Error | null;
  count?: number;
}

// Filter types
export interface UserFilters {
  expertise?: string;
  priceRange?: string;
  level?: string;
  location?: string;
  searchQuery?: string;
  userType?: UserType;
  status?: UserStatus;
  isAvailable?: boolean;
}

export interface CollaborationFilters {
  status?: CollaborationStatus;
  urgency?: UrgencyLevel;
  projectType?: string;
  budgetRange?: string;
  searchQuery?: string;
  userId?: string;
  userType?: 'client' | 'mua';
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Statistics types
export interface UserStats {
  totalUsers: number;
  muaCount: number;
  museCount: number;
  clientCount: number;
  activeUsers: number;
  onlineUsers: number;
}

export interface CollaborationStats {
  total: number;
  pending: number;
  accepted: number;
  declined: number;
  inProgress: number;
  completed: number;
}

export interface PortfolioStats {
  totalViews: number;
  weeklyViews: number;
  monthlyViews: number;
  collaborationRequests: number;
  completedProjects: number;
}

// Form data types
export interface UserCreateData extends Omit<DatabaseUser, 'id' | 'created_at' | 'updated_at'> {}
export interface UserUpdateData extends Partial<Omit<DatabaseUser, 'id' | 'created_at' | 'updated_at'>> {}

export interface CollaborationCreateData extends Omit<CollaborationRequest, 'id' | 'created_at' | 'updated_at'> {}
export interface CollaborationUpdateData extends Partial<Omit<CollaborationRequest, 'id' | 'created_at' | 'updated_at'>> {}

export interface MuaPortfolioCreateData extends Omit<MuaPortfolio, 'id' | 'created_at' | 'updated_at'> {}
export interface MuaPortfolioUpdateData extends Partial<Omit<MuaPortfolio, 'id' | 'created_at' | 'updated_at'>> {}

export interface MuseCharacteristicsCreateData extends Omit<MuseCharacteristics, 'id' | 'created_at' | 'updated_at'> {}
export interface MuseCharacteristicsUpdateData extends Partial<Omit<MuseCharacteristics, 'id' | 'created_at' | 'updated_at'>> {}

// Utility types
export type TableName = 
  | 'users'
  | 'muse_characteristics'
  | 'mua_portfolios'
  | 'mua_before_after_images'
  | 'mua_services'
  | 'mua_testimonials'
  | 'collaboration_requests'
  | 'portfolio_images'
  | 'vouchers'
  | 'notifications'
  | 'messages'
  | 'bookings'
  | 'payments';

export type ViewName = 
  | 'user_profiles'
  | 'active_collaboration_requests';

// Constants
export const USER_TYPES: UserType[] = ['client', 'mua', 'muse', 'admin'];
export const USER_STATUSES: UserStatus[] = ['online', 'offline', 'connecting', 'available', 'busy'];
export const COLLABORATION_STATUSES: CollaborationStatus[] = ['pending', 'accepted', 'declined', 'counter_offered', 'in_progress', 'completed'];
export const URGENCY_LEVELS: UrgencyLevel[] = ['normal', 'urgent', 'flexible'];

// Type guards
export const isMuseUser = (user: DatabaseUser): boolean => user.user_type === 'muse';
export const isMuaUser = (user: DatabaseUser): boolean => user.user_type === 'mua';
export const isClientUser = (user: DatabaseUser): boolean => user.user_type === 'client';
export const isAdminUser = (user: DatabaseUser): boolean => user.user_type === 'admin';

export const hasMuseCharacteristics = (user: CompleteUserProfile): user is CompleteUserProfile & { characteristics: MuseCharacteristics } => 
  Boolean(user.characteristics);

export const hasMuaPortfolio = (user: CompleteUserProfile): user is CompleteUserProfile & { muaPortfolio: MuaPortfolio } => 
  Boolean(user.muaPortfolio);