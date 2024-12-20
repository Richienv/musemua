export function BusinessSchema() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          "name": "Salda",
          "image": "https://salda.id/icon-salda.png",
          "priceRange": "Rp500.000 - Rp5.000.000",
          "address": {
            "@type": "PostalAddress",
            "addressCountry": "ID"
          }
        })
      }}
    />
  )
} 