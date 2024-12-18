/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://salda.id',
  generateRobotsTxt: true,
  changefreq: 'daily',
  priority: 0.7,
  sitemapSize: 5000,
  generateIndexSitemap: false,
  outDir: 'public',
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
      },
    ],
    additionalSitemaps: [
      'https://salda.id/sitemap.xml',
    ],
  },
} 