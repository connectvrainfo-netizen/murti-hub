-- ============================================================================
-- AMOL MARBLE MURTI BHANDAR - COMPLETE SEED SCRIPT
-- Populates:
-- 1. Master Sizes (9 cm Compact, 15 cm Mandir, 24 cm Grand Temple, 1 Foot, 1.5 Feet)
-- 2. Categories with banners and icons
-- 3. Products (Murtis) with primary catalog images & catalog gallery JSONB arrays
-- 4. Murti Variants linked to Master Sizes
-- 5. Navratri 2026 Festive Section with linked items & special pricing
-- 6. Customer Reviews with Star Ratings and Seller Replies
-- 7. Default Admin Account
-- ============================================================================

-- 1. MASTER SIZES (Req #7)
INSERT INTO public.master_sizes (id, label, height_inches, description, sort_order, is_active)
VALUES 
  ('11111111-1111-1111-1111-111111110001', '9 cm (Compact)', 3.54, 'Ideal for office desk, car dash or compact puja room', 1, true),
  ('11111111-1111-1111-1111-111111110002', '15 cm (Home Mandir)', 5.90, 'Our most popular size for everyday home mandir worship', 2, true),
  ('11111111-1111-1111-1111-111111110003', '24 cm (Grand Temple)', 9.45, 'Substantial idol for dedicated temple rooms & altars', 3, true),
  ('11111111-1111-1111-1111-111111110004', '1.5 Feet (18 Inches)', 18.00, 'Hand-carved single Makrana marble block for large mandirs', 4, true),
  ('11111111-1111-1111-1111-111111110005', 'Mandal 3 Feet', 36.00, 'Sanctified temple installation piece with high relief chiselwork', 5, true)
ON CONFLICT (label) DO NOTHING;

-- 2. CATEGORIES (Req #1)
INSERT INTO public.categories (id, name, slug, deity, route, img, banner_url, description, sort_order, is_active)
VALUES
  ('22222222-2222-2222-2222-222222220001', 'Gajanan Maharaj', 'gajanan-maharaj', 'Gajanan Maharaj', 'shop-all', '/images/categories/gajanan-maharaj@2x.png', '/images/categories/gajanan-maharaj@2x.png', 'Sant Shiromani Shri Gajanan Maharaj idols in Makrana marble', 1, true),
  ('22222222-2222-2222-2222-222222220002', 'Navratri Drop', 'navratri-drop', 'Durga', 'navratri', '/images/categories/navratri-drop@2x.png', '/images/categories/navratri-drop@2x.png', 'Limited edition Navratri idols of Maa Durga, Lakshmi & Parvati', 2, true),
  ('22222222-2222-2222-2222-222222220003', 'Shiva', 'shiva', 'Shiva', 'shop-all', '/images/categories/shiva@2x.png', '/images/categories/shiva@2x.png', 'Mahadev, Narmadeshwar Shivling and sacred Nandi idols', 3, true),
  ('22222222-2222-2222-2222-222222220004', 'Hanuman', 'hanuman', 'Hanuman', 'shop-all', '/images/categories/hanuman@2x.png', '/images/categories/hanuman@2x.png', 'Veer Hanuman Ji, Sanjeevani and Anjali Mudra murtis', 4, true),
  ('22222222-2222-2222-2222-222222220005', 'Krishna', 'krishna', 'Krishna', 'shop-all', '/images/categories/krishna@2x.png', '/images/categories/krishna@2x.png', 'Bal Gopal and Kanha with Bansuri hand-carved murtis', 5, true),
  ('22222222-2222-2222-2222-222222220006', 'Ganpati', 'ganpati', 'Ganesha', 'shop-all', '/images/categories/ganpati@2x.png', '/images/categories/ganpati@2x.png', 'Vighnaharta Ganesha in white Makrana marble with modak', 6, true),
  ('22222222-2222-2222-2222-222222220007', 'Ram', 'ram', 'Ram', 'shop-all', '/images/categories/ram@2x.png', '/images/categories/ram@2x.png', 'Ayodhya Shri Ram Darbar complete family altar idols', 7, true),
  ('22222222-2222-2222-2222-222222220008', 'Durga & Shakti', 'durga-shakti', 'Durga', 'shop-all', '/images/categories/durga-shakti@2x.png', '/images/categories/durga-shakti@2x.png', 'Sherawali Maa Durga 8-armed sanctified marble idols', 8, true),
  ('22222222-2222-2222-2222-222222220009', 'Murugan', 'murugan', 'Murugan', 'shop-all', '/images/categories/murugan@2x.png', '/images/categories/murugan@2x.png', 'Lord Murugan and Bhagwan Dattatreya trimurti idols', 9, true),
  ('22222222-2222-2222-2222-222222220010', 'Hand Paint', 'hand-paint', 'Sacred Art', 'sacred', '/images/categories/hand-paint@2x.png', '/images/categories/hand-paint@2x.png', '24K gold foil embossed hand-painted sacred artifacts', 10, true)
ON CONFLICT (slug) DO NOTHING;

-- 3. PRODUCTS / MURTIS (Req #2, Req #3: Dedicated Catalog Image Section, Req #5: Rating Mode)
INSERT INTO public.murtis (
  id, legacy_id, title, slug, deity, group_tag, price, old_price, off_text, 
  material, description, primary_catalog_image, catalog_images, rating_mode, static_rating_value, is_featured
)
VALUES
  (
    '33333333-3333-3333-3333-333333330001', 1,
    'Ram Darbar - Divine Blessings | Ram, Sita, Laxman & Hanuman in Pure White Marble',
    'ram-darbar-divine-blessings', 'Ram', 'most-loved', 1499.00, 2599.00, '42% off',
    'Pure White Makrana Marble',
    'Sanctified Shri Ram Darbar featuring Prabhu Ram, Mata Sita, Lakshman Ji and Bhakt Hanuman in eternal devotion. Hand-carved in Grade-A Makrana marble with delicate 24K gold foil accents.',
    '/images/products/ram-darbar.png',
    '[
      {"url": "/images/products/ram-darbar.png", "caption": "Front Sacred View - Golden Mukut & Bow", "sort_order": 1},
      {"url": "/images/products/ram-darbar.png", "caption": "Detailed Hand Carving of Lakshman & Hanuman", "sort_order": 2},
      {"url": "/images/products/ram-darbar.png", "caption": "Back Inscription & Makrana Polished Marble", "sort_order": 3}
    ]'::jsonb,
    'enabled', 5.00, true
  ),
  (
    '33333333-3333-3333-3333-333333330002', 2,
    'Bal Ganesha & Kanha with Bansuri - 9 cm Hand-Carved Marble Murti',
    'bal-ganesha-kanha-bansuri', 'Krishna', 'most-loved', 1499.00, 1999.00, '25% off',
    'Pure White Makrana Marble',
    'Tender Baal Roop depicting Little Krishna with his flute alongside Bal Ganesha with laddu. Fills every room with innocence, joy and protection.',
    '/images/products/bal-ganesha-flute.png',
    '[
      {"url": "/images/products/bal-ganesha-flute.png", "caption": "Pran Pratishtha Ready Baal Roop", "sort_order": 1},
      {"url": "/images/products/bal-ganesha-flute.png", "caption": "Golden Bansuri & Mor Pankh Detailing", "sort_order": 2}
    ]'::jsonb,
    'enabled', 5.00, true
  ),
  (
    '33333333-3333-3333-3333-333333330003', 3,
    'Standing Mahadev with Golden Trishul, Damru & Crescent Moon',
    'standing-mahadev-golden-trishul', 'Shiva', 'most-loved', 1499.00, 2599.00, '42% off',
    'Pure White Makrana Marble',
    'Majestic standing Lord Shiva holding the Trishul and Damru with Chandra crescent and holy Ganga emanating from His Jata. High Polish finish.',
    '/images/products/standing-shiva-trishul.png',
    '[
      {"url": "/images/products/standing-shiva-trishul.png", "caption": "Standing Mahadev with Golden Trishul", "sort_order": 1},
      {"url": "/images/products/standing-shiva-trishul.png", "caption": "Hand-Polished Serpent Hood & Damru", "sort_order": 2}
    ]'::jsonb,
    'enabled', 4.95, true
  ),
  (
    '33333333-3333-3333-3333-333333330004', 4,
    'Black Narmadeshwar Shivling with Sacred Rudraksha Mala Altar',
    'black-narmadeshwar-shivling-rudraksha', 'Shiva', 'most-loved', 1299.00, 1599.00, '18% off',
    'Natural Narmada River Stone & White Marble',
    'Consecrated naturally formed Narmadeshwar Shivling nestled on a white marble Yoni Peeth with an authentic 108 Panchamukhi Rudraksha garland.',
    '/images/products/black-shivling-rudraksha.png',
    '[
      {"url": "/images/products/black-shivling-rudraksha.png", "caption": "Natural Sacred Narmadeshwar Stone", "sort_order": 1}
    ]'::jsonb,
    'read_only', 4.90, false
  ),
  (
    '33333333-3333-3333-3333-333333330005', 5,
    'Sacred Shivling with Golden Sheshnaag Hood on Marble Pedestal',
    'sacred-shivling-golden-sheshnaag', 'Shiva', 'most-loved', 999.00, 2999.00, '66% off',
    'Resin-Bonded Makrana Marble',
    'Lord Shiva Lingam with a 5-headed golden brass Sheshnaag canopy sheltering the holy Lingam. Perfect for car dashboard or home mandir.',
    '/images/products/shivling-sheshnaag.png',
    '[
      {"url": "/images/products/shivling-sheshnaag.png", "caption": "5-Headed Sheshnaag Golden Hood", "sort_order": 1}
    ]'::jsonb,
    'enabled', 4.95, true
  ),
  (
    '33333333-3333-3333-3333-333333330006', 6,
    'Sherawali Maa Durga on Lion - 8 Armed Sanctified Marble Idol',
    'sherawali-maa-durga-lion', 'Durga', 'baal-roop', 1299.00, 1999.00, '35% off',
    'Pure White Makrana Marble',
    'Eight-armed Maa Durga seated on her sacred lion carrier, wielding divine weapons of righteousness with abhaya mudra granting fearlessness.',
    '/images/products/durga-sherawali.png',
    '[
      {"url": "/images/products/durga-sherawali.png", "caption": "Sherawali Maa Durga Front View", "sort_order": 1}
    ]'::jsonb,
    'enabled', 5.00, false
  ),
  (
    '33333333-3333-3333-3333-333333330007', 7,
    'Maa Lakshmi & Parvati – The Grace of Abundance | 24K Gold Zaree Detailing',
    'maa-lakshmi-parvati-grace', 'Durga', 'navratri', 1499.00, 1999.00, '25% OFF',
    'Pure White Makrana Marble with 24K Gold',
    'Divine pair of Maa Lakshmi and Mata Parvati hand-sculpted for prosperity, peace and auspiciousness during Navratri and Diwali pooja.',
    '/images/products/parvati-lakshmi.png',
    '[
      {"url": "/images/products/parvati-lakshmi.png", "caption": "Maa Lakshmi & Parvati 24K Gold Zaree", "sort_order": 1}
    ]'::jsonb,
    'enabled', 5.00, true
  ),
  (
    '33333333-3333-3333-3333-333333330008', 8,
    'Maa Durga – The Spirit of Celebration | Hand-Finished Lion-Riding Idol',
    'maa-durga-spirit-celebration', 'Durga', 'navratri', 1499.00, 1999.00, '25% OFF',
    'Pure White Makrana Marble',
    'Hand-finished lion-riding idol consecrated for Navratri Golu, home temple installation and festive gifting.',
    '/images/products/durga-sherawali.png',
    '[
      {"url": "/images/products/durga-sherawali.png", "caption": "Maa Durga Festive Drop Special", "sort_order": 1}
    ]'::jsonb,
    'enabled', 5.00, true
  ),
  (
    '33333333-3333-3333-3333-333333330009', 9,
    'Bhagwan Dattatreya (Trimurti Brahma, Vishnu & Shiva) with Kamadhenu Cow',
    'bhagwan-dattatreya-trimurti', 'Murugan', 'navratri', 1499.00, 1999.00, '25% OFF',
    'Pure White Makrana Marble',
    'Tri-avatar of Brahma, Vishnu and Shiva with four dogs representing four Vedas and sacred Kamadhenu wish-fulfilling cow.',
    '/images/products/dattatreya-kamadhenu.png',
    '[
      {"url": "/images/products/dattatreya-kamadhenu.png", "caption": "Bhagwan Dattatreya with Kamadhenu", "sort_order": 1}
    ]'::jsonb,
    'enabled', 4.90, false
  ),
  (
    '33333333-3333-3333-3333-333333330010', 10,
    'Handcrafted Brass Temple Shikhar Kalash – Golden Temple Finial',
    'handcrafted-brass-temple-shikhar-kalash', 'Shiva', 'navratri', 1499.00, 1999.00, '25% OFF',
    'Heavy Mirror-Polished Brass',
    'Sacred temple kalash finial cast in virgin temple brass to sanctify temple mandir peaks, gopurams and household sanctums.',
    '/images/products/brass-shikhar-kalash.png',
    '[
      {"url": "/images/products/brass-shikhar-kalash.png", "caption": "Temple Brass Shikhar Kalash", "sort_order": 1}
    ]'::jsonb,
    'enabled', 5.00, false
  ),
  (
    '33333333-3333-3333-3333-333333330015', 15,
    'Sant Shiromani Shri Gajanan Maharaj Seated Idol in White Makrana Marble',
    'sant-gajanan-maharaj-seated', 'Gajanan Maharaj', 'sacred', 1299.00, 1999.00, '35% OFF',
    'Pure White Makrana Marble',
    'Shegaon divine saint Gajanan Maharaj seated in meditative samadhi posture with gentle compassionate gaze.',
    '/images/products/gajanan-maharaj.png',
    '[
      {"url": "/images/products/gajanan-maharaj.png", "caption": "Shri Gajanan Maharaj Seated Avatar", "sort_order": 1}
    ]'::jsonb,
    'enabled', 5.00, true
  )
ON CONFLICT (id) DO NOTHING;

-- 4. MURTI VARIANTS LINKED TO MASTER SIZES (Req #7)
-- Add variants for Ram Darbar (Product #1)
INSERT INTO public.murti_variants (murti_id, size_id, variant_name, price, discount_price, stock_quantity)
VALUES
  ('33333333-3333-3333-3333-333333330001', '11111111-1111-1111-1111-111111110001', '9 cm Compact (Altar & Desk)', 1499.00, 2599.00, 50),
  ('33333333-3333-3333-3333-333333330001', '11111111-1111-1111-1111-111111110002', '15 cm (Home Mandir)', 2099.00, 3199.00, 35),
  ('33333333-3333-3333-3333-333333330001', '11111111-1111-1111-1111-111111110003', '24 cm (Grand Temple)', 2999.00, 4599.00, 20)
ON CONFLICT DO NOTHING;

-- Add variants for Mahadev (Product #3)
INSERT INTO public.murti_variants (murti_id, size_id, variant_name, price, discount_price, stock_quantity)
VALUES
  ('33333333-3333-3333-3333-333333330003', '11111111-1111-1111-1111-111111110001', '9 cm Compact', 1499.00, 2599.00, 40),
  ('33333333-3333-3333-3333-333333330003', '11111111-1111-1111-1111-111111110002', '15 cm Home Mandir', 2099.00, 3199.00, 25)
ON CONFLICT DO NOTHING;

-- 5. FESTIVAL SECTION (Req #6: Title, Subtitle, Banner, Linked Products with Override Price)
INSERT INTO public.festival_sections (
  id, title, subtitle, banner_image_url, badge_text, announcement_tag, is_active, start_date, end_date
)
VALUES (
  '44444444-4444-4444-4444-444444440001',
  'Navratri Collection',
  'A Meaningful Gift. A Blessing That Stays. Consecrated Sherawali Maa Durga, Lakshmi & Parvati in pristine white Makrana marble with 24K gold foil detailing.',
  '/images/categories/navratri-drop@2x.png',
  'Navratri 2026 Special',
  'FESTIVE EDIT',
  true,
  NOW(),
  NOW() + INTERVAL '30 days'
)
ON CONFLICT (id) DO NOTHING;

-- Link Products to Festival Section with Special Override Price (Req #6)
INSERT INTO public.festival_section_items (festival_id, murti_id, festival_price, custom_tag, sort_order)
VALUES
  ('44444444-4444-4444-4444-444444440001', '33333333-3333-3333-3333-333333330007', 1349.00, 'Navratri Special 25% Off', 1),
  ('44444444-4444-4444-4444-444444440001', '33333333-3333-3333-3333-333333330008', 1349.00, 'Early Devotee Blessing', 2),
  ('44444444-4444-4444-4444-444444440001', '33333333-3333-3333-3333-333333330009', 1399.00, 'Limited Handcrafted Run', 3),
  ('44444444-4444-4444-4444-444444440001', '33333333-3333-3333-3333-333333330010', 1299.00, 'Temple Kalash Offer', 4)
ON CONFLICT (festival_id, murti_id) DO NOTHING;

-- 6. REVIEWS WITH RATINGS & SELLER REPLIES (Req #5)
INSERT INTO public.reviews (
  id, murti_id, author, avatar_color, location, rating, title, content, verified, helpful_count, unhelpful_count, tag, has_photo, photo_url, seller_reply, is_approved
)
VALUES
  (
    '55555555-5555-5555-5555-555555550001',
    '33333333-3333-3333-3333-333333330001',
    'Radha Raman S.',
    'bg-amber-700',
    'Jaipur, Rajasthan',
    5,
    'The divine serenity on the face is hypnotic — sits beautifully in my home mandir!',
    'Ordered this sacred murti for our home mandir. The weight and finish of the Makrana marble is exceptional, and the hand-painted 24K gold accents catch the morning light beautifully during aarti. Pran Pratishtha fragrance was still fresh when unboxed!',
    true, 42, 1, 'car-dash', true, '/images/products/ram-darbar.png',
    '{"author": "Amol Murti Concierge (Master Sculptor Team)", "date": "11 Oct 2026", "text": "Namaste Radha Raman ji! We are deeply humbled to know that Bhagwan is accompanying your journeys with grace and safety. May every drive bring divine peace and protection to you and your family. Jai Shri Krishna!"}'::jsonb,
    true
  ),
  (
    '55555555-5555-5555-5555-555555550002',
    '33333333-3333-3333-3333-333333330001',
    'Dr. Ananya Iyer',
    'bg-emerald-700',
    'Bengaluru, Karnataka',
    5,
    'Arrived in a 7-layer cushioned wooden crate in pristine condition',
    'Living in South India, I was initially anxious about fragile marble delivery from Rajasthan. But the packaging exceeded all expectations! The idol was nestled inside custom impact-resistant velvet casing within an outer wooden crate. Flawless chisel symmetry, no scratches, pure white Makrana marble stone density. Highly recommended for home mandir installation.',
    true, 29, 0, 'mandir', false, NULL,
    '{"author": "Amol Murti Concierge", "date": "05 Oct 2026", "text": "Pranam Dr. Ananya ji! Thank you for placing your faith in our Jaipur artisans. Our Zero-Breakage Crating guarantee exists precisely so devotees across India receive their sanctified idols without a scratch. Shubham Bhavatu!"}'::jsonb,
    true
  )
ON CONFLICT (id) DO NOTHING;

-- 7. DEFAULT ADMIN USER (admin@amolmurtibhandar.com / admin123)
-- Password hash generated with bcrypt for "admin123"
INSERT INTO public.admin_users (id, email, full_name, password_hash, role, is_active)
VALUES (
  '66666666-6666-6666-6666-666666660001',
  'admin@amolmurtibhandar.com',
  'Master Sculptor Admin',
  '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', -- bcrypt hash for 'admin123'
  'super_admin',
  true
)
ON CONFLICT (email) DO NOTHING;
