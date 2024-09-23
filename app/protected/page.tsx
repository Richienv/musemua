import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { StreamerList } from "@/components/streamer-list";

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
    .select('id, name, platform, category, rating, price, image_url, bio, location');

  if (streamersError) {
    console.error('Error fetching streamers:', streamersError);
    return <div className="text-center text-red-500">Error loading streamers. Please try again later.</div>;
  }

  if (!streamers || streamers.length === 0) {
    return <div className="text-center">No streamers found.</div>;
  }

  return (
    <div className="flex-1 w-full flex flex-col items-center">
      <div className="w-full bg-[#000080] text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-center mb-4">Welcome to Lilo!</h1>
          <p className="text-xl text-center mb-8">Discover hassle-free livestreaming sellers with 250+ top creators across various platforms</p>
          <StreamerList initialStreamers={streamers} />
        </div>
      </div>
      <div className="w-full bg-black py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div id="streamer-cards-container"></div>
        </div>
      </div>
    </div>
  );
}
