/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      {
        source: '/',
        has: [
          {
            type: 'host',
            value: 'liloapp.vercel.app',
          },
        ],
        destination: 'https://salda.id',
        permanent: true,
      },
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'liloapp.vercel.app',
          },
        ],
        destination: 'https://salda.id/:path*',
        permanent: true,
      },
    ]
  },
  headers: async () => {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: process.env.NODE_ENV === 'production' 
              ? 'index, follow'
              : 'noindex, nofollow'
          },
          {
            key: 'Link',
            value: '<https://salda.id>; rel="canonical"',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig