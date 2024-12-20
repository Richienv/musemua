import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/settings/',
          '/messages/',
        ],
      },
    ],
    sitemap: 'https://salda.id/sitemap.xml',
  }
} 