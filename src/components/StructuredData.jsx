import React, { useEffect } from 'react';
import { seoConfig } from '../config/seoConfig';

/**
 * StructuredData Component
 * Injects Google-compliant Schema.org JSON-LD (@graph with LocalBusiness/Store, FAQPage,
 * BreadcrumbList, and Product schemas) and dynamically manages document head metadata
 * for seamless SPA crawling and social link unfurls.
 */
export default function StructuredData({
    currentPage = 'home',
    selectedProduct = null,
    activeDeityFilter = null
}) {
    const { siteUrl, address, geo, rating, contact, faqs, openGraph } = seoConfig;

    // Determine dynamic title, description, and canonical URL based on route
    let pageTitle = seoConfig.primaryTitle;
    let pageDesc = seoConfig.metaDescription;
    let canonicalUrl = `${siteUrl}/`;
    let ogImage = `${siteUrl}${openGraph.defaultImage}`;

    if (currentPage === 'product' && selectedProduct) {
        pageTitle = `${selectedProduct.title} | Amol Marble Murti Bhandar Shegaon`;
        pageDesc = selectedProduct.description 
            ? `${selectedProduct.description.slice(0, 155)}... Buy from Amol Marble Murti Bhandar Shegaon.`
            : `Buy authentic ${selectedProduct.title} handcrafted in pure Makrana marble at Amol Marble Murti Bhandar, Shegaon, Maharashtra. Best price, insured delivery.`;
        canonicalUrl = `${siteUrl}/?product=${encodeURIComponent(selectedProduct.id || selectedProduct.legacy_id)}`;
        if (selectedProduct.img) {
            ogImage = selectedProduct.img.startsWith('http') 
                ? selectedProduct.img 
                : `${siteUrl}${selectedProduct.img}`;
        }
    } else if (currentPage === 'shop-all') {
        const deityText = activeDeityFilter ? `${activeDeityFilter} Murtis` : 'All Sacred Marble Idols';
        pageTitle = `${deityText} | Amol Marble Murti Bhandar Shegaon`;
        pageDesc = `Explore our collection of authentic ${deityText} in pure Makrana white marble. Consecrated for home mandirs. Visit showroom on Bus Stand Road, Shegaon.`;
        canonicalUrl = activeDeityFilter 
            ? `${siteUrl}/?category=${encodeURIComponent(activeDeityFilter)}` 
            : `${siteUrl}/?page=shop-all`;
    } else if (currentPage === 'navratri') {
        pageTitle = 'Navratri Festive Marble Idols & Maa Durga Murtis | Amol Marble Murti Bhandar Shegaon';
        pageDesc = 'Special festive collection of hand-painted Sherawali Maa Durga, Lakshmi & Saraswati marble murtis at Amol Marble Murti Bhandar, Shegaon.';
        canonicalUrl = `${siteUrl}/?page=navratri`;
    } else if (currentPage === 'sacred') {
        pageTitle = 'Sacred Temple Collectibles & Brass Kalash | Amol Marble Murti Bhandar Shegaon';
        pageDesc = 'Curated range of sacred temple brass kalash, shikhars, and masterwork marble idols in Shegaon, Maharashtra.';
        canonicalUrl = `${siteUrl}/?page=sacred`;
    } else if (currentPage === 'baal-roop') {
        pageTitle = 'Baal Roop Marble Idols (Bal Ganesha, Kanha, Hanuman) | Amol Marble Murti Bhandar Shegaon';
        pageDesc = 'Adorable child forms of divine deities hand-sculpted in Makrana marble for home altars at Amol Marble Murti Bhandar, Shegaon.';
        canonicalUrl = `${siteUrl}/?page=baal-roop`;
    }

    // Synchronize document <head> on state/route updates
    useEffect(() => {
        if (typeof document === 'undefined') return;

        // 1. Update Title
        document.title = pageTitle;

        // 2. Update Meta Description
        const descMeta = document.querySelector('meta[name="description"]');
        if (descMeta) {
            descMeta.setAttribute('content', pageDesc);
        }

        // 3. Update Canonical Tag
        let canonicalLink = document.querySelector('link[rel="canonical"]');
        if (!canonicalLink) {
            canonicalLink = document.createElement('link');
            canonicalLink.setAttribute('rel', 'canonical');
            document.head.appendChild(canonicalLink);
        }
        canonicalLink.setAttribute('href', canonicalUrl);

        // 4. Update OpenGraph Tags
        const ogTitle = document.querySelector('meta[property="og:title"]');
        if (ogTitle) ogTitle.setAttribute('content', pageTitle);

        const ogDesc = document.querySelector('meta[property="og:description"]');
        if (ogDesc) ogDesc.setAttribute('content', pageDesc);

        const ogUrl = document.querySelector('meta[property="og:url"]');
        if (ogUrl) ogUrl.setAttribute('content', canonicalUrl);

        const ogImg = document.querySelector('meta[property="og:image"]');
        if (ogImg) ogImg.setAttribute('content', ogImage);

        // 5. Update Twitter Tags
        const twTitle = document.querySelector('meta[name="twitter:title"]');
        if (twTitle) twTitle.setAttribute('content', pageTitle);

        const twDesc = document.querySelector('meta[name="twitter:description"]');
        if (twDesc) twDesc.setAttribute('content', pageDesc);

        const twImg = document.querySelector('meta[name="twitter:image"]');
        if (twImg) twImg.setAttribute('content', ogImage);

    }, [pageTitle, pageDesc, canonicalUrl, ogImage]);

    // Build Breadcrumb List Schema
    const breadcrumbItems = [
        {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: `${siteUrl}/`
        }
    ];

    if (currentPage === 'product' && selectedProduct) {
        if (selectedProduct.deity) {
            breadcrumbItems.push({
                '@type': 'ListItem',
                position: 2,
                name: `${selectedProduct.deity} Idols`,
                item: `${siteUrl}/?category=${encodeURIComponent(selectedProduct.deity)}`
            });
            breadcrumbItems.push({
                '@type': 'ListItem',
                position: 3,
                name: selectedProduct.title,
                item: canonicalUrl
            });
        } else {
            breadcrumbItems.push({
                '@type': 'ListItem',
                position: 2,
                name: selectedProduct.title,
                item: canonicalUrl
            });
        }
    } else if (currentPage !== 'home') {
        breadcrumbItems.push({
            '@type': 'ListItem',
            position: 2,
            name: activeDeityFilter ? `${activeDeityFilter} Murtis` : 'Sacred Murtis',
            item: canonicalUrl
        });
    }

    // Construct Comprehensive @graph
    const graph = [
        // 1. LocalBusiness / Store Schema
        {
            '@type': ['Store', 'LocalBusiness'],
            '@id': `${siteUrl}/#localbusiness`,
            name: seoConfig.brandName,
            alternateName: seoConfig.brandNameHindi,
            description: seoConfig.metaDescription,
            url: siteUrl,
            telephone: contact.phoneRaw,
            priceRange: seoConfig.priceRange,
            image: `${siteUrl}/images/logo.png`,
            logo: `${siteUrl}/images/logo.png`,
            hasMap: seoConfig.googleMapsUrl,
            sameAs: [
                seoConfig.googleMapsUrl,
                contact.social.facebook,
                contact.social.instagram,
                contact.social.youtube
            ],
            address: {
                '@type': 'PostalAddress',
                streetAddress: address.streetAddress,
                addressLocality: address.addressLocality,
                addressRegion: address.addressRegion,
                addressCountry: address.addressCountry,
                postalCode: address.postalCode
            },
            geo: {
                '@type': 'GeoCoordinates',
                latitude: Number(geo.latitude),
                longitude: Number(geo.longitude)
            },
            openingHoursSpecification: [
                {
                    '@type': 'OpeningHoursSpecification',
                    dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
                    opens: seoConfig.openingHours.opens,
                    closes: seoConfig.openingHours.closes
                }
            ],
            aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: rating.ratingValue,
                bestRating: rating.bestRating,
                worstRating: rating.worstRating,
                ratingCount: rating.ratingCount
            },
            areaServed: [
                { '@type': 'City', name: 'Shegaon' },
                { '@type': 'AdministrativeArea', name: 'Buldhana' },
                { '@type': 'AdministrativeArea', name: 'Maharashtra' },
                { '@type': 'Country', name: 'India' }
            ],
            currenciesAccepted: 'INR',
            paymentAccepted: 'Cash, Credit Card, Debit Card, UPI, Net Banking'
        },

        // 2. FAQPage Schema
        {
            '@type': 'FAQPage',
            '@id': `${siteUrl}/#faq`,
            mainEntity: faqs.map(faq => ({
                '@type': 'Question',
                name: faq.question,
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: faq.answer
                }
            }))
        },

        // 3. BreadcrumbList Schema
        {
            '@type': 'BreadcrumbList',
            '@id': `${siteUrl}/#breadcrumbs`,
            itemListElement: breadcrumbItems
        }
    ];

    // 4. Product Schema (if viewing a product)
    if (currentPage === 'product' && selectedProduct) {
        graph.push({
            '@type': 'Product',
            '@id': `${canonicalUrl}#product`,
            name: selectedProduct.title,
            description: selectedProduct.description || `${selectedProduct.title} - Handcrafted Makrana marble idol by Amol Marble Murti Bhandar Shegaon.`,
            image: ogImage,
            brand: {
                '@type': 'Brand',
                name: seoConfig.brandName
            },
            category: selectedProduct.deity || 'Marble Idols',
            material: selectedProduct.material || 'Makrana White Marble',
            offers: {
                '@type': 'Offer',
                priceCurrency: 'INR',
                price: String(selectedProduct.price || 1499),
                availability: 'https://schema.org/InStock',
                url: canonicalUrl,
                seller: {
                    '@type': 'Organization',
                    name: seoConfig.brandName
                },
                itemCondition: 'https://schema.org/NewCondition'
            },
            aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: String(selectedProduct.static_rating_value || rating.ratingValue),
                bestRating: '5',
                worstRating: '1',
                ratingCount: String(rating.ratingCount)
            }
        });
    }

    const structuredDataJson = JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': graph
    });

    return (
        <script
            type="application/ld+json"
            id="structured-data-jsonld"
            dangerouslySetInnerHTML={{ __html: structuredDataJson }}
        />
    );
}
