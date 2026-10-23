import { catalog, deityCategories } from '../data/catalog';
import { seoConfig } from '../config/seoConfig';

/**
 * Dynamic Sitemap Generator
 * Programmatically builds an XML sitemap from current live catalog and category records.
 */
export function generateSitemapXml(products = catalog, categories = deityCategories, baseUrl = seoConfig.siteUrl) {
    const today = new Date().toISOString().split('T')[0];
    const cleanBase = baseUrl.replace(/\/+$/, '');

    const staticRoutes = [
        { path: '/', priority: '1.0', changefreq: 'weekly' },
        { path: '/?page=shop-all', priority: '0.9', changefreq: 'weekly' },
        { path: '/?page=navratri', priority: '0.85', changefreq: 'weekly' },
        { path: '/?page=sacred', priority: '0.8', changefreq: 'weekly' },
        { path: '/?page=baal-roop', priority: '0.8', changefreq: 'weekly' },
    ];

    const categoryRoutes = categories.map(cat => ({
        path: `/?category=${encodeURIComponent(cat.deity || cat.name)}`,
        priority: cat.name.includes('Gajanan') ? '0.95' : '0.8',
        changefreq: 'weekly'
    }));

    const productRoutes = products.map(prod => ({
        path: `/?product=${encodeURIComponent(prod.id || prod.legacy_id)}`,
        priority: prod.title.includes('Gajanan') ? '0.9' : '0.8',
        changefreq: 'weekly',
        image: prod.img ? (prod.img.startsWith('http') ? prod.img : `${cleanBase}${prod.img}`) : null,
        title: prod.title
    }));

    const allEntries = [...staticRoutes, ...categoryRoutes, ...productRoutes];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n`;

    allEntries.forEach(entry => {
        xml += `  <url>\n`;
        xml += `    <loc>${cleanBase}${entry.path}</loc>\n`;
        xml += `    <lastmod>${today}</lastmod>\n`;
        xml += `    <changefreq>${entry.changefreq}</changefreq>\n`;
        xml += `    <priority>${entry.priority}</priority>\n`;
        if (entry.image) {
            xml += `    <image:image>\n`;
            xml += `      <image:loc>${entry.image}</image:loc>\n`;
            xml += `      <image:title>${entry.title || 'Amol Marble Murti Bhandar Shegaon'}</image:title>\n`;
            xml += `    </image:image>\n`;
        }
        xml += `  </url>\n`;
    });

    xml += `</urlset>`;
    return xml;
}
