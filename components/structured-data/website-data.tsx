export function WebsiteStructuredData() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Salda",
          url: "https://salda.id",
          potentialAction: {
            "@type": "SearchAction",
            target: {
              "@type": "EntryPoint",
              urlTemplate: "https://salda.id/search?q={search_term_string}"
            },
            "query-input": "required name=search_term_string"
          }
        })
      }}
    />
  )
} 