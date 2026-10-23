/**
 * Centralized SEO & Business Configuration for Amol Marble Murti Bhandar
 * Location: Shegaon, Buldhana District, Maharashtra, India
 * 
 * Update placeholders here to reflect changes across:
 * - HTML Head Metadata (OpenGraph, Twitter, Canonical, Geo)
 * - Schema.org Structured Data (LocalBusiness, FAQPage, BreadcrumbList, Product)
 * - On-page Showroom & Footer NAP (Name, Address, Phone)
 * - Sitemap and Robots definitions
 */

export const seoConfig = {
    // 1. Site & Domain
    siteUrl: typeof import.meta !== 'undefined' && import.meta.env?.VITE_SITE_URL 
        ? import.meta.env.VITE_SITE_URL.replace(/\/+$/, '') 
        : 'https://amolmurtibhandar.com',
    
    // 2. Brand Identity
    brandName: 'Amol Marble Murti Bhandar',
    brandNameHindi: 'अमोल मार्बल मूर्ती भंडार',
    tagline: 'Best Marble Idols & Statues in Shegaon',
    
    // 3. Titles & Descriptions
    primaryTitle: 'Amol Marble Murti Bhandar | Best Marble Idols & Statues in Shegaon',
    titleTemplate: '%s | Amol Marble Murti Bhandar Shegaon',
    metaDescription: 'Discover premium marble murtis, Gajanan Maharaj idols, and custom Hindu god statues at Amol Marble Murti Bhandar, Bus Stand Road, near Murarka High School, Shegaon, Maharashtra.',
    
    // 4. Targeted High-Intent Keywords
    keywords: [
        'Amol Marble Murti Bhandar',
        'Marble murti shop in Shegaon',
        'Gajanan Maharaj marble murti Shegaon',
        'Hindu god marble statues Maharashtra',
        'Makrana marble idols',
        'Murti shop near Murarka High School Shegaon',
        'Best murti shop in Buldhana district',
        'Buy marble idols online',
        'Custom marble statues',
        'White marble Ganesh murti',
        'Pooja room murtis'
    ],

    // 5. Contact & Social
    contact: {
        phone: '+91 98765 43210',
        phoneRaw: '+919876543210',
        whatsapp: '+919876543210',
        email: 'care@amolmurtibhandar.com',
        social: {
            facebook: 'https://facebook.com/amolmurtibhandar',
            instagram: 'https://instagram.com/amolmurtibhandar',
            youtube: 'https://youtube.com/@amolmurtibhandar'
        }
    },

    // 6. NAP (Name, Address, Phone) & Local Business
    address: {
        streetAddress: 'Bus Stand Road, Near Murarka High School',
        addressLocality: 'Shegaon',
        addressDistrict: 'Buldhana',
        addressRegion: 'Maharashtra',
        regionCode: 'IN-MH',
        postalCode: '444203',
        addressCountry: 'IN',
        formatted: 'Bus Stand Road, Near Murarka High School, Shegaon, Buldhana District, Maharashtra 444203'
    },

    // 7. Geo Positioning
    geo: {
        region: 'IN-MH',
        placename: 'Shegaon, Buldhana, Maharashtra',
        latitude: '20.7937',
        longitude: '76.6946',
        position: '20.7937;76.6946',
        icbm: '20.7937, 76.6946'
    },

    // 8. Google Maps & Store Details
    googleMapsUrl: 'https://maps.app.goo.gl/Ekzz1e5eooC5WbEg6',
    priceRange: '₹₹',
    openingHours: {
        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        opens: '08:00',
        closes: '20:00',
        display: 'Open Daily: 8:00 AM – 8:00 PM IST',
        specification: 'Mo-Su 08:00-20:00'
    },

    // 9. Ratings & Reputation
    rating: {
        ratingValue: '4.9',
        bestRating: '5',
        worstRating: '1',
        ratingCount: '50',
        display: '4.9★ (50+ Google Maps Devotee Reviews)'
    },

    // 10. OpenGraph & Twitter
    openGraph: {
        type: 'website',
        locale: 'en_IN',
        siteName: 'Amol Marble Murti Bhandar',
        defaultImage: '/images/logo.png',
        defaultImageAlt: 'Amol Marble Murti Bhandar Shegaon - Authentic Marble Idols & Murtis',
        twitterCard: 'summary_large_image'
    },

    // 11. High-Intent Local FAQs (Aligned with Schema.org & On-page Display)
    faqs: [
        {
            question: 'Where can I buy authentic Gajanan Maharaj marble murtis in Shegaon?',
            answer: 'You can buy authentic, hand-carved Gajanan Maharaj marble murtis at Amol Marble Murti Bhandar, conveniently located on Bus Stand Road, near Murarka High School, Shegaon, Maharashtra (444203). We offer pure Makrana white marble idols crafted with devotion, Pran Pratishtha readiness, and exquisite finishing.'
        },
        {
            question: 'Do you offer custom marble statue carving and temple murti orders?',
            answer: 'Yes! Amol Marble Murti Bhandar specializes in custom marble murti carving and large temple statues. Our hereditary master sculptors craft custom-sized murtis of Lord Ganesha, Mahadev Shiva, Ram Darbar, Durga Mata, and Shri Gajanan Maharaj matching your home mandir or temple altar specifications.'
        },
        {
            question: 'What are the timings of Amol Marble Murti Bhandar on Bus Stand Road, Shegaon?',
            answer: 'Our Shegaon showroom is open every day (Monday through Sunday) from 08:00 AM to 08:00 PM IST. Devotees and pilgrims visiting Shri Sant Gajanan Maharaj Sansthan are warmly welcome to visit us on Bus Stand Road near Murarka High School.'
        },
        {
            question: 'Do you provide safe packaging and delivery for marble idols outside Shegaon?',
            answer: 'Yes, we provide insured express delivery across Buldhana, Vidarbha, all Maharashtra districts, and pan-India. Every idol is packaged in our signature 7-layer cushioned wooden crate with a 100% Zero-Breakage Guarantee.'
        }
    ]
};

export default seoConfig;
