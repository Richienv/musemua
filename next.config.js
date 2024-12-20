/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'vyqfrngufeidndakhyib.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://youtu.be https://app.sandbox.midtrans.com https://app.midtrans.com",
          },
        ],
      },
      {
        source: '/icon-salda.png',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate'
          }
        ]
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/undefined/:path*',
        destination: '/:path*',
        permanent: false,
      },
      {
        source: '/undefined/client-bookings',
        destination: '/client-bookings',
        permanent: false,
      }
    ];
  },
  reactStrictMode: true,
  swcMinify: true,
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(ico|png|svg|xml|webmanifest)$/,
      use: [
        {
          loader: 'file-loader',
          options: {
            name: '[name].[ext]',
            publicPath: '/_next/static/media',
            outputPath: 'static/media',
          },
        },
      ],
    });
    return config;
  },
}

module.exports = nextConfig