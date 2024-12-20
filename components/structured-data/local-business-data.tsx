export function LocalBusinessStructuredData() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          name: "Salda",
          image: "https://salda.id/icon-salda.png",
          "@id": "https://salda.id",
          url: "https://salda.id",
          telephone: "+62xxx",
          priceRange: "Rp500.000 - Rp5.000.000",
          address: {
            "@type": "PostalAddress",
            streetAddress: "Your Street Address",
            addressLocality: "Jakarta",
            addressRegion: "DKI Jakarta",
            postalCode: "xxxxx",
            addressCountry: "ID"
          },
          geo: {
            "@type": "GeoCoordinates",
            latitude: -6.2088,
            longitude: 106.8456
          },
          openingHoursSpecification: {
            "@type": "OpeningHoursSpecification",
            dayOfWeek: [
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday"
            ],
            opens: "09:00",
            closes: "17:00"
          }
        })
      }}
    />
  )
} 