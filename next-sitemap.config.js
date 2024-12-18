/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://salda.gg',
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
      'https://salda.gg/sitemap.xml',
    ],
  },
} 