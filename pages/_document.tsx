import Document, { Html, Head, Main, NextScript, DocumentProps } from 'next/document'

class MyDocument extends Document<DocumentProps> {
  render() {
    return (
      <Html lang="en">
        <Head>
          {/* Favicon and App Icons */}
          <link rel="icon" type="image/png" href="/icon-salda.png" />
          <link rel="icon" type="image/png" sizes="32x32" href="/icon-salda.png" />
          <link rel="icon" type="image/png" sizes="16x16" href="/icon-salda.png" />
          <link rel="apple-touch-icon" sizes="180x180" href="/icon-salda.png" />
          <link rel="mask-icon" href="/icon-salda.png" color="#4F46E5" />
          <meta name="msapplication-TileImage" content="/icon-salda.png" />
          <meta name="theme-color" content="#4F46E5" />
          
          {/* Primary Meta Tags */}
          <meta name="title" content="Salda - Streaming Community Platform" />
          <meta name="description" content="Join Salda to connect with your favorite streamers and gaming community. The ultimate platform for streamers and viewers." />
          
          {/* Open Graph / Facebook */}
          <meta property="og:type" content="website" />
          <meta property="og:url" content="https://salda.id" />
          <meta property="og:site_name" content="Salda" />
          <meta property="og:title" content="Salda - Streaming Community Platform" />
          <meta property="og:description" content="Join Salda to connect with your favorite streamers and gaming community" />
          <meta property="og:image" content="https://salda.id/icon-salda.png" />
          <meta property="og:image:width" content="1200" />
          <meta property="og:image:height" content="630" />
          
          {/* Twitter */}
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:url" content="https://salda.id" />
          <meta name="twitter:title" content="Salda - Streaming Community Platform" />
          <meta name="twitter:description" content="Join Salda to connect with your favorite streamers and gaming community" />
          <meta name="twitter:image" content="https://salda.id/icon-salda.png" />
          
          {/* Search Engine Optimization */}
          <meta name="robots" content="index, follow" />
          <link rel="canonical" href="https://salda.id" />
          
          {/* PWA */}
          <link rel="manifest" href="/manifest.json" />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}

export default MyDocument 