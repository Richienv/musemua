import { defaultMetadata } from './metadata'

export const metadata = defaultMetadata

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <head>
        {/* Basic favicon */}
        <link rel="icon" href="/favicon.ico" />
        
        {/* iOS icons */}
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        
        {/* Android/Chrome icons */}
        <link rel="icon" type="image/png" sizes="192x192" href="/web-app-manifest-192x192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/web-app-manifest-512x512.png" />
        <link rel="icon" type="image/png" sizes="96x96" href="/favicon-96x96.png" />
        
        {/* Web manifest */}
        <link rel="manifest" href="/site.webmanifest" />
        
        {/* Microsoft Tile */}
        <meta name="msapplication-TileImage" content="/web-app-manifest-192x192.png" />
        <meta name="msapplication-TileColor" content="#ffffff" />
        
        {/* Safari pinned tab */}
        <link rel="mask-icon" href="/favicon.svg" color="#5bbad5" />
      </head>
      <body>{children}</body>
    </html>
  )
}
