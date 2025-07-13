-- =====================================================
-- MUSE/MUA Platform - Comprehensive Dummy Data
-- =====================================================
-- Run this after creating the main schema to populate with realistic test data

-- =====================================================
-- USERS DATA (MUA + MUSE + Clients)
-- =====================================================

-- MUA Users
INSERT INTO public.users (
    id, first_name, last_name, display_name, email, user_type, status, 
    image_url, expertise, location, clients_reached, projects_completed, 
    instagram_followers, instagram_handle, is_available
) VALUES 
-- MUA 1: Sari Dewi (Jakarta)
(
    '550e8400-e29b-41d4-a716-446655440001',
    'Sari', 'Dewi', 'Sari Dewi', 'sari.dewi@email.com', 'mua', 'connecting',
    'https://images.unsplash.com/photo-1494790108755-2616b612b272?w=400&h=600&fit=crop&crop=face',
    'MUA Ahli', 'Jakarta', 142, 89, '45K', 'sari_dewi_mua', true
),
-- MUA 2: Putri Lestari (Bandung)
(
    '550e8400-e29b-41d4-a716-446655440002',
    'Putri', 'Lestari', 'Putri Lestari', 'putri.lestari@email.com', 'mua', 'online',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=600&fit=crop&crop=face',
    'MUA Bersertifikat', 'Bandung', 78, 52, '23K', 'putri_lestari_makeup', true
),
-- MUA 3: Maya Sari (Surabaya)
(
    '550e8400-e29b-41d4-a716-446655440003',
    'Maya', 'Sari', 'Maya Sari', 'maya.sari@email.com', 'mua', 'available',
    'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=600&fit=crop&crop=face',
    'MUA Profesional', 'Surabaya', 34, 18, '12K', 'maya_sari_beauty', true
),
-- MUA 4: Luna Pratiwi (Yogyakarta)
(
    '550e8400-e29b-41d4-a716-446655440004',
    'Luna', 'Pratiwi', 'Luna Pratiwi', 'luna.pratiwi@email.com', 'mua', 'busy',
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=600&fit=crop&crop=face',
    'Spesialis Kecantikan Senior', 'Yogyakarta', 156, 112, '78K', 'luna_pratiwi_studio', false
),
-- MUA 5: Intan Permata (Bali)
(
    '550e8400-e29b-41d4-a716-446655440005',
    'Intan', 'Permata', 'Intan Permata', 'intan.permata@email.com', 'mua', 'online',
    'https://images.unsplash.com/photo-1488207984690-078bdd7cb0dd?w=400&h=600&fit=crop&crop=face',
    'Direktur Kreatif', 'Bali', 203, 145, '120K', 'intan_permata_creative', true
),
-- MUA 6: Zahra Amelia (Medan)
(
    '550e8400-e29b-41d4-a716-446655440006',
    'Zahra', 'Amelia', 'Zahra Amelia', 'zahra.amelia@email.com', 'mua', 'connecting',
    'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=600&fit=crop&crop=face',
    'Konsultan Kecantikan', 'Medan', 98, 67, '34K', 'zahra_amelia_makeup', true
),
-- MUA 7: Citra Wulandari (Semarang)
(
    '550e8400-e29b-41d4-a716-446655440007',
    'Citra', 'Wulandari', 'Citra Wulandari', 'citra.wulandari@email.com', 'mua', 'offline',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=600&fit=crop&crop=face',
    'Stylist Kecantikan Ahli', 'Semarang', 87, 63, '29K', 'citra_beauty_stylist', false
),
-- MUA 8: Rina Safitri (Malang)
(
    '550e8400-e29b-41d4-a716-446655440008',
    'Rina', 'Safitri', 'Rina Safitri', 'rina.safitri@email.com', 'mua', 'available',
    'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400&h=600&fit=crop&crop=face',
    'MUA Bersertifikat', 'Malang', 123, 94, '56K', 'rina_safitri_glam', true
),
-- MUA 9: Olivia Maharani (Makassar)
(
    '550e8400-e29b-41d4-a716-446655440009',
    'Olivia', 'Maharani', 'Olivia Maharani', 'olivia.maharani@email.com', 'mua', 'online',
    'https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?w=400&h=600&fit=crop&crop=face',
    'Direktur Seni', 'Makassar', 176, 128, '89K', 'olivia_maharani_art', true
),
-- MUA 10: Ava Kusuma (Palembang)
(
    '550e8400-e29b-41d4-a716-446655440010',
    'Ava', 'Kusuma', 'Ava Kusuma', 'ava.kusuma@email.com', 'mua', 'connecting',
    'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400&h=600&fit=crop&crop=face',
    'MUA Pemula', 'Palembang', 45, 23, '8K', 'ava_kusuma_makeup', true
),
-- MUA 11: Grace Indira (Denpasar)
(
    '550e8400-e29b-41d4-a716-446655440011',
    'Grace', 'Indira', 'Grace Indira', 'grace.indira@email.com', 'mua', 'available',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=600&fit=crop&crop=face',
    'Spesialis Fotografi', 'Denpasar', 134, 98, '67K', 'grace_indira_photo', true
),
-- MUA 12: Mia Kartika (Batam)
(
    '550e8400-e29b-41d4-a716-446655440012',
    'Mia', 'Kartika', 'Mia Kartika', 'mia.kartika@email.com', 'mua', 'busy',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=600&fit=crop&crop=face',
    'Ahli Kecantikan Kreatif', 'Batam', 89, 56, '31K', 'mia_kartika_creative', false
);

-- MUSE Users
INSERT INTO public.users (
    id, first_name, last_name, display_name, email, user_type, status, 
    image_url, expertise, location, clients_reached, projects_completed, 
    instagram_followers, instagram_handle, is_available
) VALUES 
-- MUSE 1: Kaia Salsabila (Jakarta)
(
    '550e8400-e29b-41d4-a716-446655450001',
    'Kaia', 'Salsabila', 'Kaia Salsabila', 'kaia.salsabila@email.com', 'muse', 'online',
    'https://images.unsplash.com/photo-1526510747491-58f928ec870f?w=400&h=600&fit=crop&crop=face',
    'Professional Model', 'Jakarta', 89, 72, '145K', 'kaia_salsabila', true
),
-- MUSE 2: Bella Aurellia (Bandung)
(
    '550e8400-e29b-41d4-a716-446655450002',
    'Bella', 'Aurellia', 'Bella Aurellia', 'bella.aurellia@email.com', 'muse', 'available',
    'https://images.unsplash.com/photo-1479936343636-73cdc5aae0c3?w=400&h=600&fit=crop&crop=face',
    'Fashion Model', 'Bandung', 67, 54, '89K', 'bella_aurellia', true
),
-- MUSE 3: Naia Ramadhani (Surabaya)
(
    '550e8400-e29b-41d4-a716-446655450003',
    'Naia', 'Ramadhani', 'Naia Ramadhani', 'naia.ramadhani@email.com', 'muse', 'connecting',
    'https://images.unsplash.com/photo-1534751516642-a1af1ef26a56?w=400&h=600&fit=crop&crop=face',
    'Commercial Model', 'Surabaya', 45, 38, '67K', 'naia_ramadhani', true
),
-- MUSE 4: Aria Windani (Bali)
(
    '550e8400-e29b-41d4-a716-446655450004',
    'Aria', 'Windani', 'Aria Windani', 'aria.windani@email.com', 'muse', 'busy',
    'https://images.unsplash.com/photo-1525134479668-1bee5c7c6845?w=400&h=600&fit=crop&crop=face',
    'Editorial Model', 'Bali', 78, 61, '123K', 'aria_windani', false
),
-- MUSE 5: Zara Maharani (Yogyakarta)
(
    '550e8400-e29b-41d4-a716-446655450005',
    'Zara', 'Maharani', 'Zara Maharani', 'zara.maharani@email.com', 'muse', 'offline',
    'https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=400&h=600&fit=crop&crop=face',
    'Runway Model', 'Yogyakarta', 56, 43, '78K', 'zara_maharani', false
);

-- =====================================================
-- MUA PORTFOLIOS
-- =====================================================

INSERT INTO public.mua_portfolios (
    id, user_id, tagline, specialties, price_range, years_experience, 
    certifications, products_used
) VALUES 
-- Sari Dewi Portfolio
(
    '550e8400-e29b-41d4-a716-446655460001',
    '550e8400-e29b-41d4-a716-446655440001',
    'Transforming Beauty, Creating Confidence',
    ARRAY['Bridal Makeup', 'Editorial', 'Special Effects', 'Fashion'],
    'Rp 800K - 2.5M',
    8,
    ARRAY['MAC Cosmetics Certified', 'Bobbi Brown Professional', 'Advanced Bridal Specialist'],
    ARRAY['MAC', 'Bobbi Brown', 'Urban Decay', 'Too Faced', 'Fenty Beauty']
),
-- Putri Lestari Portfolio
(
    '550e8400-e29b-41d4-a716-446655460002',
    '550e8400-e29b-41d4-a716-446655440002',
    'Natural Beauty, Elevated Elegance',
    ARRAY['Natural Makeup', 'Bridal', 'Corporate Events'],
    'Rp 500K - 1.5M',
    5,
    ARRAY['NARS Certified', 'L\'Oreal Professional'],
    ARRAY['NARS', 'L\'Oreal', 'Charlotte Tilbury', 'Rare Beauty']
),
-- Maya Sari Portfolio
(
    '550e8400-e29b-41d4-a716-446655460003',
    '550e8400-e29b-41d4-a716-446655440003',
    'Modern Glamour for Every Occasion',
    ARRAY['Fashion', 'Photoshoot', 'Party Makeup'],
    'Rp 400K - 1M',
    3,
    ARRAY['Maybelline Professional', 'Basic Makeup Artistry'],
    ARRAY['Maybelline', 'NYX', 'Milani', 'e.l.f.']
),
-- Luna Pratiwi Portfolio
(
    '550e8400-e29b-41d4-a716-446655460004',
    '550e8400-e29b-41d4-a716-446655440004',
    'Luxury Beauty Experiences',
    ARRAY['High-End Bridal', 'Celebrity', 'Red Carpet', 'Editorial'],
    'Rp 2M - 5M',
    12,
    ARRAY['Dior Certified', 'Chanel Beauty Professional', 'Tom Ford Master Class'],
    ARRAY['Dior', 'Chanel', 'Tom Ford', 'Pat McGrath', 'La Mer']
),
-- Intan Permata Portfolio
(
    '550e8400-e29b-41d4-a716-446655460005',
    '550e8400-e29b-41d4-a716-446655440005',
    'Creative Vision, Flawless Execution',
    ARRAY['Creative Editorial', 'Avant-garde', 'Fashion Week', 'Art Direction'],
    'Rp 1.5M - 3.5M',
    10,
    ARRAY['Make Up For Ever Artist', 'Kryolan Professional', 'Creative Makeup Institute'],
    ARRAY['Make Up For Ever', 'Kryolan', 'Inglot', 'Ben Nye', 'Mehron']
);

-- =====================================================
-- MUA SERVICES
-- =====================================================

-- Sari Dewi Services
INSERT INTO public.mua_services (
    portfolio_id, name, description, price, duration, is_featured, display_order
) VALUES 
(
    '550e8400-e29b-41d4-a716-446655460001',
    'Bridal Makeup', 'Complete bridal transformation including trial', 'Rp 2,500,000', '4-5 hours', true, 1
),
(
    '550e8400-e29b-41d4-a716-446655460001',
    'Editorial/Fashion', 'High-fashion looks for photoshoots and runway', 'Rp 1,500,000', '2-3 hours', true, 2
),
(
    '550e8400-e29b-41d4-a716-446655460001',
    'Special Event', 'Glamorous makeup for parties and formal events', 'Rp 800,000', '1.5-2 hours', false, 3
),
(
    '550e8400-e29b-41d4-a716-446655460001',
    'Special Effects', 'Creative and theatrical makeup for film/TV', 'Rp 2,000,000', '3-4 hours', false, 4
);

-- Putri Lestari Services
INSERT INTO public.mua_services (
    portfolio_id, name, description, price, duration, is_featured, display_order
) VALUES 
(
    '550e8400-e29b-41d4-a716-446655460002',
    'Natural Bridal', 'Soft, natural bridal look with lasting power', 'Rp 1,500,000', '3-4 hours', true, 1
),
(
    '550e8400-e29b-41d4-a716-446655460002',
    'Corporate Events', 'Professional makeup for business events', 'Rp 600,000', '1-2 hours', false, 2
),
(
    '550e8400-e29b-41d4-a716-446655460002',
    'Engagement Shoot', 'Perfect makeup for pre-wedding photos', 'Rp 800,000', '2 hours', true, 3
);

-- Luna Pratiwi Services
INSERT INTO public.mua_services (
    portfolio_id, name, description, price, duration, is_featured, display_order
) VALUES 
(
    '550e8400-e29b-41d4-a716-446655460004',
    'Luxury Bridal Package', 'Premium bridal experience with luxury products', 'Rp 5,000,000', '6-8 hours', true, 1
),
(
    '550e8400-e29b-41d4-a716-446655460004',
    'Celebrity Red Carpet', 'High-end makeup for premieres and galas', 'Rp 3,500,000', '3-4 hours', true, 2
),
(
    '550e8400-e29b-41d4-a716-446655460004',
    'Fashion Editorial', 'Editorial makeup for magazine shoots', 'Rp 2,500,000', '4-5 hours', false, 3
);

-- =====================================================
-- MUA BEFORE/AFTER IMAGES
-- =====================================================

-- Sari Dewi Before/After Images
INSERT INTO public.mua_before_after_images (
    portfolio_id, before_image_url, after_image_url, category, description, display_order
) VALUES 
(
    '550e8400-e29b-41d4-a716-446655460001',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=600&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=600&fit=crop&crop=face',
    'Bridal', 'Traditional Indonesian bridal transformation with gold accents', 1
),
(
    '550e8400-e29b-41d4-a716-446655460001',
    'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400&h=600&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?w=400&h=600&fit=crop&crop=face',
    'Editorial', 'High fashion editorial look with dramatic contouring', 2
),
(
    '550e8400-e29b-41d4-a716-446655460001',
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=600&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1488207984690-078bdd7cb0dd?w=400&h=600&fit=crop&crop=face',
    'Special Event', 'Glamorous evening look for red carpet event', 3
);

-- Luna Pratiwi Before/After Images
INSERT INTO public.mua_before_after_images (
    portfolio_id, before_image_url, after_image_url, category, description, display_order
) VALUES 
(
    '550e8400-e29b-41d4-a716-446655460004',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=600&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=600&fit=crop&crop=face',
    'Luxury Bridal', 'Sophisticated bridal look with luxury product finish', 1
),
(
    '550e8400-e29b-41d4-a716-446655460004',
    'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400&h=600&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1526510747491-58f928ec870f?w=400&h=600&fit=crop&crop=face',
    'Red Carpet', 'Celebrity-level glamour for premiere event', 2
);

-- =====================================================
-- MUA TESTIMONIALS
-- =====================================================

-- Sari Dewi Testimonials
INSERT INTO public.mua_testimonials (
    portfolio_id, client_name, rating, review, event, client_image_url, is_featured
) VALUES 
(
    '550e8400-e29b-41d4-a716-446655460001',
    'Maya Puspita', 5, 'Sari made my wedding day absolutely perfect! Her attention to detail and artistic vision exceeded all my expectations.', 'Wedding',
    'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=600&fit=crop&crop=face', true
),
(
    '550e8400-e29b-41d4-a716-446655460001',
    'Indira Sari', 5, 'Professional, talented, and so easy to work with. My photoshoot looked absolutely stunning thanks to her work.', 'Fashion Photoshoot', null, false
),
(
    '550e8400-e29b-41d4-a716-446655460001',
    'Ratna Dewi', 5, 'Best MUA in Jakarta! She transformed me for my gala event and I felt like a movie star.', 'Gala Event', null, true
);

-- Luna Pratiwi Testimonials
INSERT INTO public.mua_testimonials (
    portfolio_id, client_name, rating, review, event, client_image_url, is_featured
) VALUES 
(
    '550e8400-e29b-41d4-a716-446655460004',
    'Angelina Jolie (Local Celebrity)', 5, 'Luna is absolutely incredible! The luxury experience and flawless result made my red carpet debut unforgettable.', 'Film Premiere',
    'https://images.unsplash.com/photo-1494790108755-2616b612b272?w=400&h=600&fit=crop&crop=face', true
),
(
    '550e8400-e29b-41d4-a716-446655460004',
    'Priscilla Maharani', 5, 'Worth every penny! Luna created the most stunning bridal look that lasted 12+ hours perfectly.', 'Wedding',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=600&fit=crop&crop=face', true
);

-- =====================================================
-- MUSE CHARACTERISTICS
-- =====================================================

INSERT INTO public.muse_characteristics (
    user_id, height, bust, waist, hips, shoes, suit, hair_color, eye_color, 
    ethnicity, eye_type, nose_type, lip_type, brow_type, eyelid_type
) VALUES 
-- Kaia Salsabila
(
    '550e8400-e29b-41d4-a716-446655450001',
    '178', '84', '61', '87', '40', '46', 'BLACK', 'BROWN',
    'Asian', 'Almond', 'Straight', 'Full', 'Arched', 'Double'
),
-- Bella Aurellia
(
    '550e8400-e29b-41d4-a716-446655450002',
    '175', '86', '63', '89', '39', '48', 'BROWN', 'HAZEL',
    'Mixed', 'Cat', 'Button', 'Medium', 'Straight', 'Double'
),
-- Naia Ramadhani
(
    '550e8400-e29b-41d4-a716-446655450003',
    '171', '88', '65', '91', '38', '50', 'DARK BROWN', 'BROWN',
    'Asian', 'Round', 'Aquiline', 'Heart-shaped', 'Angular', 'Mono'
),
-- Aria Windani
(
    '550e8400-e29b-41d4-a716-446655450004',
    '180', '82', '59', '85', '41', '44', 'BLONDE', 'BLUE',
    'Mixed', 'Deep-set', 'Greek', 'Bow', 'Thick', 'Double'
),
-- Zara Maharani
(
    '550e8400-e29b-41d4-a716-446655450005',
    '176', '85', '62', '88', '39', '46', 'RED', 'GREEN',
    'Mixed', 'Hooded', 'Roman', 'Wide', 'Feathered', 'Double'
);

-- =====================================================
-- PORTFOLIO IMAGES (General - for both MUA and MUSE)
-- =====================================================

-- Kaia Salsabila Portfolio Images
INSERT INTO public.portfolio_images (
    user_id, image_url, caption, category, is_featured, display_order
) VALUES 
(
    '550e8400-e29b-41d4-a716-446655450001',
    'https://images.unsplash.com/photo-1526510747491-58f928ec870f?w=400&h=600&fit=crop&crop=face&seed=1',
    'Fashion Week Jakarta 2024', 'Fashion', true, 1
),
(
    '550e8400-e29b-41d4-a716-446655450001',
    'https://images.unsplash.com/photo-1526510747491-58f928ec870f?w=400&h=600&fit=crop&crop=face&seed=2',
    'Editorial Shoot for Vogue Indonesia', 'Editorial', true, 2
),
(
    '550e8400-e29b-41d4-a716-446655450001',
    'https://images.unsplash.com/photo-1526510747491-58f928ec870f?w=400&h=600&fit=crop&crop=face&seed=3',
    'Beauty Campaign for Local Brand', 'Beauty', false, 3
);

-- Bella Aurellia Portfolio Images
INSERT INTO public.portfolio_images (
    user_id, image_url, caption, category, is_featured, display_order
) VALUES 
(
    '550e8400-e29b-41d4-a716-446655450002',
    'https://images.unsplash.com/photo-1479936343636-73cdc5aae0c3?w=400&h=600&fit=crop&crop=face&seed=1',
    'Street Style Photography', 'Street', true, 1
),
(
    '550e8400-e29b-41d4-a716-446655450002',
    'https://images.unsplash.com/photo-1479936343636-73cdc5aae0c3?w=400&h=600&fit=crop&crop=face&seed=2',
    'Commercial for Fashion Brand', 'Commercial', false, 2
);

-- =====================================================
-- COLLABORATION REQUESTS
-- =====================================================

INSERT INTO public.collaboration_requests (
    id, client_id, mua_id, project_type, budget_range, timeline, urgency,
    description, requirements, client_name, client_email, client_phone,
    client_company, status, response_deadline
) VALUES 
(
    '550e8400-e29b-41d4-a716-446655470001',
    '550e8400-e29b-41d4-a716-446655450001', -- Kaia as client
    '550e8400-e29b-41d4-a716-446655440001', -- Sari Dewi as MUA
    'Fashion Show', 'Rp 5,000,000 - Rp 10,000,000', '2-4 weeks', 'urgent',
    'Looking for a professional MUA for our upcoming fashion show featuring sustainable fashion brands. We need someone who can create bold, editorial looks that complement our eco-friendly theme.',
    'Experience with editorial makeup, ability to work with diverse skin tones, knowledge of photography-friendly techniques',
    'Sarah Jessica Chen', 'sarah@ecofashionweek.com', '+62 812 3456 7890',
    'Eco Fashion Week Indonesia', 'pending',
    NOW() + INTERVAL '3 days'
),
(
    '550e8400-e29b-41d4-a716-446655470002',
    '550e8400-e29b-41d4-a716-446655450002', -- Bella as client
    '550e8400-e29b-41d4-a716-446655440004', -- Luna Pratiwi as MUA
    'Wedding', 'Rp 3,000,000 - Rp 5,000,000', '1-2 months', 'normal',
    'Intimate garden wedding for 50 guests. Looking for a luxury bridal look with long-lasting formulas for outdoor ceremony.',
    'Luxury bridal experience, outdoor event expertise, trial session availability',
    'Amanda Putri', 'amanda.putri@gmail.com', '+62 813 4567 8901',
    null, 'accepted',
    NOW() + INTERVAL '5 days'
);

-- =====================================================
-- NOTIFICATIONS
-- =====================================================

INSERT INTO public.notifications (
    user_id, title, message, type, is_read, action_url
) VALUES 
(
    '550e8400-e29b-41d4-a716-446655440001',
    'New Collaboration Request',
    'You have received a new collaboration request for a Fashion Show project',
    'collaboration', false,
    '/collaboration-requests/550e8400-e29b-41d4-a716-446655470001'
),
(
    '550e8400-e29b-41d4-a716-446655440004',
    'Collaboration Accepted',
    'Your collaboration request for wedding makeup has been accepted',
    'collaboration', false,
    '/collaboration-requests/550e8400-e29b-41d4-a716-446655470002'
),
(
    '550e8400-e29b-41d4-a716-446655450001',
    'Profile Views Increased',
    'Your profile has been viewed 50+ times this week!',
    'general', true, null
);

-- =====================================================
-- SAMPLE CLIENT USERS
-- =====================================================

INSERT INTO public.users (
    id, first_name, last_name, display_name, email, user_type, status, 
    image_url, location, is_available
) VALUES 
(
    '550e8400-e29b-41d4-a716-446655480001',
    'Sarah', 'Chen', 'Sarah Chen', 'sarah.chen@ecofashion.com', 'client', 'online',
    'https://images.unsplash.com/photo-1494790108755-2616b612b272?w=400&h=400&fit=crop&crop=face',
    'Jakarta', true
),
(
    '550e8400-e29b-41d4-a716-446655480002',
    'Michael', 'Zhang', 'Michael Zhang', 'michael.zhang@glowbeauty.com', 'client', 'available',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
    'Jakarta', true
),
(
    '550e8400-e29b-41d4-a716-446655480003',
    'Amanda', 'Putri', 'Amanda Putri', 'amanda.putri@email.com', 'client', 'online',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&crop=face',
    'Bandung', true
);

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

SELECT 'Dummy data inserted successfully! 🎉' as status,
       COUNT(*) as total_users FROM public.users;

-- Show summary of inserted data
SELECT 
    user_type,
    COUNT(*) as count
FROM public.users 
GROUP BY user_type
ORDER BY user_type;