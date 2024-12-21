import { MetadataRoute } from 'next'
import { createClient } from '@/utils/supabase/server'

// Define types based on the database schema
type Streamer = {
  username: string;
  updated_at: string;
  location: string;
}

type StreamerLocation = {
  location: string;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient()
  
  // Fetch all active streamers with type assertion
  const { data: streamers } = await supabase
    .from('streamers')
    .select('username, updated_at, location')
    .eq('is_active', true) as { data: Streamer[] | null }
  
  // Fetch unique locations with type assertion
  const { data: rawLocations } = await supabase
    .from('streamers')
    .select('location')
    .eq('is_active', true) as { data: StreamerLocation[] | null }
  
  // Process locations to get unique values with proper type checking
  const uniqueLocations = rawLocations 
    ? Array.from(new Set(
        rawLocations
          .filter((item): item is StreamerLocation => 
            item !== null && 
            typeof item.location === 'string' && 
            item.location.length > 0
          )
          .map(item => item.location)
      ))
    : []

  const baseUrl = 'https://salda.id'

  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/sign-in`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/sign-up`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ]

  // Add streamer profile URLs
  const streamerRoutes: MetadataRoute.Sitemap = (streamers ?? []).map((streamer) => ({
    url: `${baseUrl}/${streamer.username}`,
    lastModified: new Date(streamer.updated_at),
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  // Add location-based pages
  const locationRoutes: MetadataRoute.Sitemap = uniqueLocations.map(location => ({
    url: `${baseUrl}/location/${encodeURIComponent(location)}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.7,
  }))

  return [...routes, ...streamerRoutes, ...locationRoutes]
} 