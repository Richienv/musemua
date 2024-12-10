import { signOutAction } from "@/app/actions";
import { hasEnvVars } from "@/utils/supabase/check-env-vars";
import Link from "next/link";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { createClient } from "@/utils/supabase/server";
import { ProfileButton } from "./profile-button";

interface UserData {
  id: string;
  email: string;
  first_name: string;
  user_type: 'streamer' | 'client';
  profile_picture_url: string | null;
  image_url?: string | null;
  streamer_id?: number;
}

export default async function AuthButton() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let userData: UserData | null = null;

  if (user) {
    // Fetch user data from the database
    const { data: userBasicData } = await supabase
      .from('users')
      .select(`
        id,
        email,
        first_name,
        user_type,
        profile_picture_url
      `)
      .eq('id', user.id)
      .single();

    if (userBasicData) {
      userData = {
        ...userBasicData,
        image_url: null,
        streamer_id: undefined
      };

      // If user is a streamer, fetch additional streamer data
      if (userBasicData.user_type === 'streamer') {
        const { data: streamerData } = await supabase
          .from('streamers')
          .select(`
            id,
            image_url
          `)
          .eq('user_id', user.id)
          .single();

        if (streamerData) {
          userData = {
            ...userData,
            image_url: streamerData.image_url,
            streamer_id: streamerData.id
          };
        }
      }
    }
  }

  if (!hasEnvVars) {
    return (
      <>
        <div className="flex gap-4 items-center">
          <div>
            <Badge
              variant={"default"}
              className="font-normal pointer-events-none"
            >
              Please update .env.local file with anon key and url
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button
              asChild
              size="sm"
              variant={"outline"}
              disabled
              className="opacity-75 cursor-none pointer-events-none"
            >
              <Link href="/sign-in">Sign in</Link>
            </Button>
            <Button
              asChild
              size="sm"
              variant={"default"}
              disabled
              className="opacity-75 cursor-none pointer-events-none"
            >
              <Link href="/sign-up">Sign up</Link>
            </Button>
          </div>
        </div>
      </>
    );
  }

  return user ? (
    <div className="flex items-center gap-4">
      <ProfileButton user={userData} />
    </div>
  ) : (
    <div className="flex gap-2">
      <Button asChild size="sm" variant={"outline"}>
        <Link href="/sign-in">Sign in</Link>
      </Button>
      <Button asChild size="sm" variant={"default"}>
        <Link href="/sign-up">Sign up</Link>
      </Button>
    </div>
  );
}
