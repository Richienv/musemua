-- =====================================================
-- MUSE/MUA Platform - Complete Supabase Database Schema
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =====================================================
-- ENUM TYPES
-- =====================================================

CREATE TYPE user_status AS ENUM ('online', 'offline', 'connecting', 'available', 'busy');
CREATE TYPE user_type AS ENUM ('client', 'mua', 'muse', 'admin');
CREATE TYPE collaboration_status AS ENUM ('pending', 'accepted', 'declined', 'counter_offered', 'in_progress', 'completed');
CREATE TYPE urgency_level AS ENUM ('normal', 'urgent', 'flexible');
CREATE TYPE discount_type AS ENUM ('percentage', 'fixed');
CREATE TYPE voucher_status AS ENUM ('active', 'expired', 'depleted');

-- =====================================================
-- CORE USERS TABLE
-- =====================================================

CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    user_type user_type NOT NULL DEFAULT 'client',
    status user_status DEFAULT 'offline',
    image_url TEXT,
    expertise TEXT,
    location VARCHAR(100),
    clients_reached INTEGER DEFAULT 0,
    projects_completed INTEGER DEFAULT 0,
    instagram_followers VARCHAR(10),
    instagram_handle VARCHAR(50),
    is_available BOOLEAN DEFAULT true,
    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- MUSE CHARACTERISTICS TABLE
-- =====================================================

CREATE TABLE public.muse_characteristics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    height VARCHAR(10),
    bust VARCHAR(10),
    waist VARCHAR(10),
    hips VARCHAR(10),
    shoes VARCHAR(10),
    suit VARCHAR(10),
    hair_color VARCHAR(20),
    eye_color VARCHAR(20),
    ethnicity VARCHAR(30),
    eye_type VARCHAR(20),
    nose_type VARCHAR(20),
    lip_type VARCHAR(20),
    brow_type VARCHAR(20),
    eyelid_type VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- MUA PORTFOLIO TABLE
-- =====================================================

CREATE TABLE public.mua_portfolios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    tagline TEXT,
    specialties TEXT[] DEFAULT '{}',
    price_range VARCHAR(50),
    years_experience INTEGER DEFAULT 0,
    certifications TEXT[] DEFAULT '{}',
    products_used TEXT[] DEFAULT '{}',
    website_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- MUA BEFORE/AFTER IMAGES TABLE
-- =====================================================

CREATE TABLE public.mua_before_after_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portfolio_id UUID REFERENCES public.mua_portfolios(id) ON DELETE CASCADE,
    before_image_url TEXT NOT NULL,
    after_image_url TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- MUA SERVICES TABLE
-- =====================================================

CREATE TABLE public.mua_services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portfolio_id UUID REFERENCES public.mua_portfolios(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price VARCHAR(50),
    duration VARCHAR(50),
    is_featured BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- MUA TESTIMONIALS TABLE
-- =====================================================

CREATE TABLE public.mua_testimonials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portfolio_id UUID REFERENCES public.mua_portfolios(id) ON DELETE CASCADE,
    client_name VARCHAR(100) NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review TEXT NOT NULL,
    event VARCHAR(100),
    client_image_url TEXT,
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- COLLABORATION REQUESTS TABLE
-- =====================================================

CREATE TABLE public.collaboration_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    mua_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    project_type VARCHAR(100) NOT NULL,
    budget_range VARCHAR(50),
    custom_budget VARCHAR(50),
    timeline VARCHAR(50),
    urgency urgency_level DEFAULT 'normal',
    description TEXT NOT NULL,
    requirements TEXT,
    client_name VARCHAR(100) NOT NULL,
    client_email VARCHAR(255) NOT NULL,
    client_phone VARCHAR(20),
    client_company VARCHAR(100),
    status collaboration_status DEFAULT 'pending',
    response_deadline TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- PORTFOLIO IMAGES TABLE (General - for MUSE/MUA)
-- =====================================================

CREATE TABLE public.portfolio_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    caption TEXT,
    category VARCHAR(50),
    is_featured BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- VOUCHERS TABLE
-- =====================================================

CREATE TABLE public.vouchers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    discount_type discount_type NOT NULL,
    discount_value DECIMAL(10,2) NOT NULL,
    max_usage INTEGER DEFAULT 1,
    current_usage INTEGER DEFAULT 0,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status voucher_status DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- NOTIFICATIONS TABLE
-- =====================================================

CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'general',
    is_read BOOLEAN DEFAULT false,
    action_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- MESSAGES TABLE
-- =====================================================

CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    collaboration_request_id UUID REFERENCES public.collaboration_requests(id) ON DELETE SET NULL,
    subject VARCHAR(255),
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- BOOKINGS TABLE
-- =====================================================

CREATE TABLE public.bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    provider_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    collaboration_request_id UUID REFERENCES public.collaboration_requests(id) ON DELETE SET NULL,
    service_type VARCHAR(100) NOT NULL,
    scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_hours DECIMAL(3,1),
    total_amount DECIMAL(10,2),
    status VARCHAR(50) DEFAULT 'pending',
    payment_status VARCHAR(50) DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- PAYMENTS TABLE
-- =====================================================

CREATE TABLE public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'IDR',
    payment_method VARCHAR(50),
    payment_provider VARCHAR(50),
    provider_transaction_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending',
    voucher_id UUID REFERENCES public.vouchers(id) ON DELETE SET NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    final_amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Users table indexes
CREATE INDEX idx_users_auth_user_id ON public.users(auth_user_id);
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_user_type ON public.users(user_type);
CREATE INDEX idx_users_location ON public.users(location);
CREATE INDEX idx_users_status ON public.users(status);

-- Portfolio related indexes
CREATE INDEX idx_mua_portfolios_user_id ON public.mua_portfolios(user_id);
CREATE INDEX idx_mua_before_after_portfolio_id ON public.mua_before_after_images(portfolio_id);
CREATE INDEX idx_mua_services_portfolio_id ON public.mua_services(portfolio_id);
CREATE INDEX idx_mua_testimonials_portfolio_id ON public.mua_testimonials(portfolio_id);

-- Collaboration requests indexes
CREATE INDEX idx_collaboration_requests_client_id ON public.collaboration_requests(client_id);
CREATE INDEX idx_collaboration_requests_mua_id ON public.collaboration_requests(mua_id);
CREATE INDEX idx_collaboration_requests_status ON public.collaboration_requests(status);
CREATE INDEX idx_collaboration_requests_created_at ON public.collaboration_requests(created_at);

-- Other important indexes
CREATE INDEX idx_portfolio_images_user_id ON public.portfolio_images(user_id);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX idx_messages_receiver_id ON public.messages(receiver_id);
CREATE INDEX idx_bookings_client_id ON public.bookings(client_id);
CREATE INDEX idx_bookings_provider_id ON public.bookings(provider_id);

-- Text search indexes
CREATE INDEX idx_users_display_name_search ON public.users USING gin(display_name gin_trgm_ops);
CREATE INDEX idx_users_expertise_search ON public.users USING gin(expertise gin_trgm_ops);

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_muse_characteristics_updated_at BEFORE UPDATE ON public.muse_characteristics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_mua_portfolios_updated_at BEFORE UPDATE ON public.mua_portfolios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_collaboration_requests_updated_at BEFORE UPDATE ON public.collaboration_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vouchers_updated_at BEFORE UPDATE ON public.vouchers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.muse_characteristics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mua_portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mua_before_after_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mua_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mua_testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaboration_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view all profiles" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = auth_user_id);
CREATE POLICY "Users can insert own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = auth_user_id);

-- MUSE characteristics policies
CREATE POLICY "Anyone can view MUSE characteristics" ON public.muse_characteristics FOR SELECT USING (true);
CREATE POLICY "MUSE can update own characteristics" ON public.muse_characteristics FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = user_id AND auth_user_id = auth.uid())
);
CREATE POLICY "MUSE can insert own characteristics" ON public.muse_characteristics FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = user_id AND auth_user_id = auth.uid())
);

-- MUA portfolio policies
CREATE POLICY "Anyone can view MUA portfolios" ON public.mua_portfolios FOR SELECT USING (true);
CREATE POLICY "MUA can manage own portfolio" ON public.mua_portfolios FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = user_id AND auth_user_id = auth.uid())
);

-- Portfolio images policies
CREATE POLICY "Anyone can view portfolio images" ON public.mua_before_after_images FOR SELECT USING (true);
CREATE POLICY "MUA can manage own portfolio images" ON public.mua_before_after_images FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.mua_portfolios mp 
        JOIN public.users u ON mp.user_id = u.id 
        WHERE mp.id = portfolio_id AND u.auth_user_id = auth.uid()
    )
);

-- Services policies
CREATE POLICY "Anyone can view MUA services" ON public.mua_services FOR SELECT USING (true);
CREATE POLICY "MUA can manage own services" ON public.mua_services FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.mua_portfolios mp 
        JOIN public.users u ON mp.user_id = u.id 
        WHERE mp.id = portfolio_id AND u.auth_user_id = auth.uid()
    )
);

-- Testimonials policies
CREATE POLICY "Anyone can view testimonials" ON public.mua_testimonials FOR SELECT USING (true);
CREATE POLICY "MUA can manage own testimonials" ON public.mua_testimonials FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.mua_portfolios mp 
        JOIN public.users u ON mp.user_id = u.id 
        WHERE mp.id = portfolio_id AND u.auth_user_id = auth.uid()
    )
);

-- Collaboration requests policies
CREATE POLICY "Users can view own collaboration requests" ON public.collaboration_requests FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = client_id AND auth_user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.users WHERE id = mua_id AND auth_user_id = auth.uid())
);
CREATE POLICY "Clients can create collaboration requests" ON public.collaboration_requests FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = client_id AND auth_user_id = auth.uid())
);
CREATE POLICY "MUA and clients can update collaboration requests" ON public.collaboration_requests FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = client_id AND auth_user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.users WHERE id = mua_id AND auth_user_id = auth.uid())
);

-- Portfolio images policies
CREATE POLICY "Anyone can view portfolio images" ON public.portfolio_images FOR SELECT USING (true);
CREATE POLICY "Users can manage own portfolio images" ON public.portfolio_images FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = user_id AND auth_user_id = auth.uid())
);

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = user_id AND auth_user_id = auth.uid())
);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = user_id AND auth_user_id = auth.uid())
);

-- Messages policies
CREATE POLICY "Users can view own messages" ON public.messages FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = sender_id AND auth_user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.users WHERE id = receiver_id AND auth_user_id = auth.uid())
);
CREATE POLICY "Users can send messages" ON public.messages FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = sender_id AND auth_user_id = auth.uid())
);

-- Bookings policies
CREATE POLICY "Users can view own bookings" ON public.bookings FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = client_id AND auth_user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.users WHERE id = provider_id AND auth_user_id = auth.uid())
);
CREATE POLICY "Clients can create bookings" ON public.bookings FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = client_id AND auth_user_id = auth.uid())
);
CREATE POLICY "Users can update own bookings" ON public.bookings FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = client_id AND auth_user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.users WHERE id = provider_id AND auth_user_id = auth.uid())
);

-- Payments policies
CREATE POLICY "Users can view own payments" ON public.payments FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = user_id AND auth_user_id = auth.uid())
);
CREATE POLICY "Users can create own payments" ON public.payments FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = user_id AND auth_user_id = auth.uid())
);

-- =====================================================
-- SAMPLE DATA INSERTION
-- =====================================================

-- Insert sample MUA user (Sari Dewi)
INSERT INTO public.users (
    id, first_name, last_name, display_name, email, user_type, status, 
    image_url, expertise, location, clients_reached, projects_completed, 
    instagram_followers, is_available
) VALUES (
    '550e8400-e29b-41d4-a716-446655440001',
    'Sari', 'Dewi', 'Sari Dewi', 'sari.dewi@email.com', 'mua', 'connecting',
    'https://images.unsplash.com/photo-1494790108755-2616b612b272?w=400&h=600&fit=crop&crop=face',
    'MUA Ahli', 'Jakarta', 142, 89, '45K', true
);

-- Insert MUA portfolio for Sari Dewi
INSERT INTO public.mua_portfolios (
    id, user_id, tagline, specialties, price_range, years_experience, 
    certifications, products_used
) VALUES (
    '550e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440001',
    'Transforming Beauty, Creating Confidence',
    ARRAY['Bridal Makeup', 'Editorial', 'Special Effects', 'Fashion'],
    'Rp 800K - 2.5M',
    8,
    ARRAY['MAC Cosmetics Certified', 'Bobbi Brown Professional', 'Advanced Bridal Specialist'],
    ARRAY['MAC', 'Bobbi Brown', 'Urban Decay', 'Too Faced', 'Fenty Beauty']
);

-- Insert sample MUSE users
INSERT INTO public.users (
    id, first_name, last_name, display_name, email, user_type, status, 
    image_url, expertise, location, clients_reached, projects_completed, 
    instagram_followers, is_available
) VALUES 
(
    '550e8400-e29b-41d4-a716-446655440003',
    'Kaia', 'Salsabila', 'Kaia Salsabila', 'kaia.salsabila@email.com', 'muse', 'online',
    'https://images.unsplash.com/photo-1526510747491-58f928ec870f?w=400&h=600&fit=crop&crop=face',
    'Professional Model', 'Jakarta', 89, 72, '145K', true
),
(
    '550e8400-e29b-41d4-a716-446655440004',
    'Bella', 'Aurellia', 'Bella Aurellia', 'bella.aurellia@email.com', 'muse', 'available',
    'https://images.unsplash.com/photo-1479936343636-73cdc5aae0c3?w=400&h=600&fit=crop&crop=face',
    'Fashion Model', 'Bandung', 67, 54, '89K', true
);

-- Insert MUSE characteristics
INSERT INTO public.muse_characteristics (
    user_id, height, bust, waist, hips, shoes, suit, hair_color, eye_color, 
    ethnicity, eye_type, nose_type, lip_type, brow_type, eyelid_type
) VALUES 
(
    '550e8400-e29b-41d4-a716-446655440003',
    '178', '84', '61', '87', '40', '46', 'BLACK', 'BROWN',
    'Asian', 'Almond', 'Straight', 'Full', 'Arched', 'Double'
),
(
    '550e8400-e29b-41d4-a716-446655440004',
    '175', '86', '63', '89', '39', '48', 'BROWN', 'HAZEL',
    'Mixed', 'Cat', 'Button', 'Medium', 'Straight', 'Double'
);

-- =====================================================
-- UTILITY FUNCTIONS
-- =====================================================

-- Function to get user type based on characteristics/portfolio
CREATE OR REPLACE FUNCTION get_user_category(user_uuid UUID)
RETURNS TEXT AS $$
DECLARE
    has_portfolio BOOLEAN;
    has_characteristics BOOLEAN;
BEGIN
    SELECT EXISTS(SELECT 1 FROM public.mua_portfolios WHERE user_id = user_uuid) INTO has_portfolio;
    SELECT EXISTS(SELECT 1 FROM public.muse_characteristics WHERE user_id = user_uuid) INTO has_characteristics;
    
    IF has_portfolio THEN
        RETURN 'MUA';
    ELSIF has_characteristics THEN
        RETURN 'MUSE';
    ELSE
        RETURN 'CLIENT';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate conversion rate
CREATE OR REPLACE FUNCTION get_conversion_rate(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    clients_reached INTEGER;
    projects_completed INTEGER;
BEGIN
    SELECT u.clients_reached, u.projects_completed 
    INTO clients_reached, projects_completed
    FROM public.users u WHERE id = user_uuid;
    
    IF clients_reached = 0 THEN
        RETURN 0;
    END IF;
    
    RETURN ROUND((projects_completed::DECIMAL / clients_reached::DECIMAL) * 100);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VIEWS FOR EASY QUERYING
-- =====================================================

-- Complete user profile view
CREATE VIEW public.user_profiles AS
SELECT 
    u.*,
    mc.height, mc.bust, mc.waist, mc.hips, mc.shoes, mc.suit,
    mc.hair_color, mc.eye_color, mc.ethnicity, mc.eye_type, mc.nose_type,
    mc.lip_type, mc.brow_type, mc.eyelid_type,
    mp.tagline, mp.specialties, mp.price_range, mp.years_experience,
    mp.certifications, mp.products_used,
    get_user_category(u.id) as user_category,
    get_conversion_rate(u.id) as conversion_rate
FROM public.users u
LEFT JOIN public.muse_characteristics mc ON u.id = mc.user_id
LEFT JOIN public.mua_portfolios mp ON u.id = mp.user_id;

-- Active collaboration requests view
CREATE VIEW public.active_collaboration_requests AS
SELECT 
    cr.*,
    client.display_name as client_display_name,
    client.image_url as client_image_url,
    mua.display_name as mua_display_name,
    mua.image_url as mua_image_url
FROM public.collaboration_requests cr
JOIN public.users client ON cr.client_id = client.id
JOIN public.users mua ON cr.mua_id = mua.id
WHERE cr.status IN ('pending', 'accepted', 'in_progress');

-- =====================================================
-- GRANTS AND PERMISSIONS
-- =====================================================

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Grant permissions to authenticated users
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Grant read permissions to anonymous users (for public profiles)
GRANT SELECT ON public.users TO anon;
GRANT SELECT ON public.muse_characteristics TO anon;
GRANT SELECT ON public.mua_portfolios TO anon;
GRANT SELECT ON public.mua_before_after_images TO anon;
GRANT SELECT ON public.mua_services TO anon;
GRANT SELECT ON public.mua_testimonials TO anon;
GRANT SELECT ON public.portfolio_images TO anon;
GRANT SELECT ON public.user_profiles TO anon;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

SELECT 'MUSE/MUA Platform Database Schema Created Successfully!' as status;