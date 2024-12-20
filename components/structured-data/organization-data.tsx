export function OrganizationStructuredData() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Salda",
          url: "https://salda.id",
          logo: "https://salda.id/icon-salda.png",
          description: "Platform yang membantu UMKM meningkatkan penjualan melalui live streaming bersama host profesional.",
          sameAs: [
            "https://instagram.com/salda.id",
            "https://tiktok.com/@salda.id"
          ],
          address: {
            "@type": "PostalAddress",
            addressCountry: "ID",
            addressRegion: "Jakarta"
          },
          potentialAction: {
            "@type": "JoinAction",
            target: {
              "@type": "EntryPoint",
              urlTemplate: "https://salda.id/sign-up",
              actionPlatform: [
                "http://schema.org/DesktopWebPlatform",
                "http://schema.org/MobileWebPlatform"
              ]
            },
            result: {
              "@type": "Organization",
              name: "Salda Membership"
            }
          }
        })
      }}
    />
  )
} 