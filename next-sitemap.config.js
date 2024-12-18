/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://salda.gg',
  generateRobotsTxt: true,
  changefreq: 'daily',
  priority: 0.7,
  sitemapSize: 5000,
  exclude: ['/server-sitemap.xml'],
  robotsTxtOptions: {
    additionalSitemaps: [
      'https://salda.gg/server-sitemap.xml',
    ],
  },
} 