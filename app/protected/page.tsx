import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Image from "next/image";
import { Star, StarHalf } from "lucide-react";

interface Streamer {
  id: number;
  user_id: string;
  name: string;
  platform: string;
  category: string;
  rating: number;
  price: number;
  image_url: string;
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

function StreamerCard({ streamer }: { streamer: Streamer }) {
  return (
    <div className="bg-background border border-foreground/10 shadow-md rounded-lg overflow-hidden transition-colors duration-300">
      <img
        src={streamer.image_url}
        alt={streamer.name}
        width={300}
        height={300}
        className="w-full h-48 object-cover"
      />
      ç<div className="p-4">
        <h3 className="font-bold text-xl mb-2 text-foreground">{streamer.name}</h3>
        <p className="text-foreground/70">{streamer.platform}</p>
        <p className="text-foreground/70">{streamer.category}</p>
        <RatingStars rating={streamer.rating} />
        <p className="text-foreground font-medium text-lg mt-2">${streamer.price.toFixed(2)}/hour</p>
      </div>
    </div>
  );
}

export default async function ProtectedPage() {
  const supabase = createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error('Error fetching user:', userError);
    return redirect("/sign-in");
  }

  const { data: streamers, error: streamersError } = await supabase
    .from('streamers')
    .select('*');

  if (streamersError) {
    console.error('Error fetching streamers:', streamersError);
    return <div className="text-center text-red-500">Error loading streamers. Please try again later.</div>;
  }

  if (!streamers || streamers.length === 0) {
    return <div className="text-center">No streamers found.</div>;
  }

  return (
    <div className="flex-1 w-full flex flex-col items-center">
      <h1 className="text-4xl font-bold mb-8 text-foreground">Welcome to Streamer Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {streamers.map((streamer: Streamer) => (
          <StreamerCard key={streamer.id} streamer={streamer} />
        ))}
      </div>
    </div>
  );
}
