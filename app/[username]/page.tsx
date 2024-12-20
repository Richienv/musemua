import { Metadata } from 'next'
import { createClient } from '@/utils/supabase/server'
import { defaultMetadata } from '../metadata'
import { StreamerRichStructuredData } from '@/components/structured-data/streamer-rich-data'
import { notFound } from 'next/navigation'

// Define the interface for testimonials
interface Testimonial {
  client_name: string;
  comment: string;
  rating: number;
  created_at: string;
}

// Define the complete StreamerRichData interface
interface StreamerRichData {
  id: number;
  first_name: string;
  last_name: string;
  bio: string | null;
  profile_picture_url: string | null;
  location: string;
  username: string;
  category: string;
  price: number;
  rating?: number;
  testimonials?: Testimonial[];
}

async function getStreamer(username: string): Promise<StreamerRichData | null> {
  const supabase = createClient()
  
  // Get streamer basic info with testimonials
  const { data: streamer } = await supabase
    .from('streamers')
    .select(`
      id,
      first_name,
      last_name,
      bio,
      profile_picture_url,
      location,
      username,
      category,
      price,
      testimonials (
        client_name,
        comment,
        rating,
        created_at
      )
    `)
    .eq('username', username)
    .single()
  
  if (!streamer) return null
  
  // Get average rating
  const { data: ratingData } = await supabase
    .from('streamer_ratings')
    .select('rating')
    .eq('streamer_id', streamer.id)
  
  const averageRating = ratingData?.length 
    ? ratingData.reduce((acc, curr) => acc + curr.rating, 0) / ratingData.length 
    : undefined

  return {
    ...streamer,
    rating: averageRating,
    testimonials: streamer.testimonials || []
  }
}

export async function generateMetadata({ params }: { params: { username: string } }): Promise<Metadata> {
  const streamer = await getStreamer(params.username)
  
  if (!streamer) {
    return defaultMetadata
  }

  const name = `${streamer.first_name} ${streamer.last_name}`
  
  return {
    title: `${name} - Professional Live Streamer di ${streamer.location}`,
    description: `Book live streaming bersama ${name}, host profesional dari ${streamer.location}. ${streamer.category ? `Spesialisasi: ${streamer.category}` : ''}`,
    openGraph: {
      ...defaultMetadata.openGraph,
      title: `${name} - Professional Live Streamer`,
      description: streamer.bio || `Live streamer profesional dari ${streamer.location}`,
      images: streamer.profile_picture_url ? [{ url: streamer.profile_picture_url }] : defaultMetadata.openGraph?.images,
    },
    alternates: {
      canonical: `https://salda.id/${streamer.username}`,
    }
  }
}

export default async function StreamerPage({ params }: { params: { username: string } }) {
  const streamer = await getStreamer(params.username)
  
  if (!streamer) {
    notFound()
  }

  return (
    <>
      <StreamerRichStructuredData streamer={streamer} />
      {/* Rest of your streamer page component */}
    </>
  )
} 