interface StreamerData {
  name: string;
  bio: string | null;
  profile_picture_url: string | null;
  location: string;
  username: string;
}

export function StreamerStructuredData({ streamer }: { streamer: StreamerData }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Person",
          name: streamer.name,
          description: streamer.bio,
          image: streamer.profile_picture_url,
          jobTitle: "Professional Live Streamer",
          worksFor: {
            "@type": "Organization",
            name: "Salda",
          },
          url: `https://salda.id/${streamer.username}`,
          location: {
            "@type": "Place",
            address: {
              "@type": "PostalAddress",
              addressLocality: streamer.location,
              addressCountry: "ID"
            }
          }
        })
      }}
    />
  )
} 