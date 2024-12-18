import Document, { Html, Head, Main, NextScript, DocumentProps } from 'next/document'

class MyDocument extends Document<DocumentProps> {
  render() {
    return (
      <Html lang="en">
        <Head>
          {/* Favicon and App Icons */}
          <link rel="icon" type="image/png" href="/favicon-96x96.png" sizes="96x96" />
          <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
          <link rel="shortcut icon" href="/favicon.ico" />
          <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
          <meta name="apple-mobile-web-app-title" content="Salda" />
          <link rel="manifest" href="/site.webmanifest" />
          
          {/* Primary Meta Tags */}
          <meta name="title" content="Salda" />
          <meta name="description" content="Salda - Your Ultimate Streaming Community Platform" />
          
          {/* Open Graph / Facebook */}
          <meta property="og:type" content="website" />
          <meta property="og:site_name" content="Salda" />
          <meta property="og:title" content="Salda - Streaming Community Platform" />
          <meta property="og:description" content="Join Salda to connect with your favorite streamers and gaming community" />
          <meta property="og:image" content="/salda-logo.png" />
          
          {/* Twitter */}
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="Salda - Streaming Community Platform" />
          <meta name="twitter:description" content="Join Salda to connect with your favorite streamers and gaming community" />
          <meta name="twitter:image" content="/salda-logo.png" />
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