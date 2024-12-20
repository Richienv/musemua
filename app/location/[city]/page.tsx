import { Metadata } from 'next'
import { createClient } from '@/utils/supabase/server'
import { defaultMetadata } from '../../metadata'
import { notFound } from 'next/navigation'
import { BreadcrumbStructuredData } from '@/components/structured-data/breadcrumb-data'

interface LocationPageProps {
  params: { city: string }
}

async function getLocationStreamers(city: string) {
  const supabase = createClient()
  const { data: streamers } = await supabase
    .from('streamers')
    .select('*')
    .eq('location', city)
    .eq('is_active', true)
  
  return streamers || []
}

export async function generateMetadata({ params }: LocationPageProps): Promise<Metadata> {
  const city = decodeURIComponent(params.city)
  const streamers = await getLocationStreamers(city)
  
  if (streamers.length === 0) {
    notFound()
  }

  return {
    title: `Live Streamer Profesional di ${city} | Salda`,
    description: `Temukan ${streamers.length}+ host live streaming profesional di ${city}. Book live streaming untuk tingkatkan penjualan UMKM Anda.`,
    openGraph: {
      ...defaultMetadata.openGraph,
      title: `Live Streamer Profesional di ${city}`,
      description: `Temukan host live streaming profesional di ${city}`,
    },
    alternates: {
      canonical: `https://salda.id/location/${encodeURIComponent(city)}`,
    }
  }
}

export default async function LocationPage({ params }: LocationPageProps) {
  const city = decodeURIComponent(params.city)
  const streamers = await getLocationStreamers(city)
  
  if (streamers.length === 0) {
    notFound()
  }

  const breadcrumbItems = [
    { name: 'Home', url: 'https://salda.id' },
    { name: 'Locations', url: 'https://salda.id/locations' },
    { name: city, url: `https://salda.id/location/${encodeURIComponent(city)}` }
  ]

  return (
    <>
      <BreadcrumbStructuredData items={breadcrumbItems} />
      {/* Your location page component */}
    </>
  )
} 