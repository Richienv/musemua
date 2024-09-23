import Image from 'next/image';
import { Star, StarHalf, MapPin } from "lucide-react";

export interface Streamer {
  id: number;
  name: string;
  platform: string;
  category: string;
  rating: number;
  price: number;
  image_url: string;
  bio: string;
  location: string;
}

function RatingStars({ rating }: { rating: number }) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;

  return (
    <div className="flex items-center">
      {[...Array(fullStars)].map((_, i) => (
        <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
      ))}
      {hasHalfStar && <StarHalf className="w-4 h-4 fill-yellow-400 text-yellow-400" />}
      <span className="ml-1 text-sm text-foreground/70">{rating.toFixed(1)}</span>
    </div>
  );
}

export function StreamerCard({ streamer }: { streamer: Streamer }) {
  return (
    <div className="bg-background border border-foreground/10 shadow-md rounded-lg overflow-hidden transition-colors duration-300 w-full max-w-sm">
      <div className="relative w-full h-48">
        <img
          src={streamer.image_url}
          alt={streamer.name}
          className="w-full h-48 object-cover"
        />
      </div>
      <div className="p-4">
        <h3 className="font-bold text-xl mb-1 text-foreground">{streamer.name}</h3>
        <div className="flex items-center text-sm text-foreground/70 mb-2">
          <MapPin className="w-4 h-4 mr-1" />
          {streamer.location}
        </div>
        <p className="text-foreground/70 mb-2">{streamer.platform} • {streamer.category}</p>
        <p className="text-sm text-foreground/80 mb-2 line-clamp-2">{streamer.bio}</p>
        <RatingStars rating={streamer.rating} />
        <p className="text-foreground font-medium text-lg mt-2">${streamer.price.toFixed(2)}/hour</p>
      </div>
    </div>
  );
}