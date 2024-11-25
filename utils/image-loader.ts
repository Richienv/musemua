import { ImageLoaderProps } from 'next/image'

export default function supabaseLoader({ src, width, quality }: ImageLoaderProps) {
  return `https://vyqfrngufeidndakhyib.supabase.co/storage/v1/object/public/${src}?width=${width}&quality=${quality || 75}`
}