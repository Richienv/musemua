// First, define the base StreamerData interface
interface StreamerData {
  name: string;
  bio: string | null;
  profile_picture_url: string | null;
  location: string;
  username: string;
}

// Then extend it for the rich data version
interface StreamerRichData {
  first_name: string;
  last_name: string;
  bio: string | null;
  profile_picture_url: string | null;
  location: string;
  username: string;
  rating?: number;
  testimonials?: {
    comment: string;
    client_name: string;
    rating: number;
    created_at: string;
  }[];
  price: number;
  category: string;
}

export function StreamerRichStructuredData({ streamer }: { streamer: StreamerRichData }) {
  // Create the name from first_name and last_name
  const fullName = `${streamer.first_name} ${streamer.last_name}`.trim();

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Person",
          name: fullName,
          description: streamer.bio,
          image: streamer.profile_picture_url,
          jobTitle: "Professional Live Streamer",
          url: `https://salda.id/${streamer.username}`,
          location: {
            "@type": "Place",
            address: {
              "@type": "PostalAddress",
              addressLocality: streamer.location,
              addressCountry: "ID"
            }
          },
          // Add service offering
          makesOffer: {
            "@type": "Offer",
            priceSpecification: {
              "@type": "PriceSpecification",
              price: streamer.price,
              priceCurrency: "IDR",
              unitText: "per hour"
            },
            itemOffered: {
              "@type": "Service",
              name: "Live Streaming Service",
              category: streamer.category
            }
          },
          // Add aggregate rating if available
          ...(streamer.rating && {
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: streamer.rating,
              bestRating: "5",
              worstRating: "1",
              ratingCount: streamer.testimonials?.length || 0
            }
          }),
          // Add reviews if available
          ...(streamer.testimonials && {
            review: streamer.testimonials.map(testimonial => ({
              "@type": "Review",
              reviewRating: {
                "@type": "Rating",
                ratingValue: testimonial.rating,
                bestRating: "5",
                worstRating: "1"
              },
              author: {
                "@type": "Person",
                name: testimonial.client_name
              },
              reviewBody: testimonial.comment,
              datePublished: testimonial.created_at
            }))
          })
        })
      }}
    />
  )
} 