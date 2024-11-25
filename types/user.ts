export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  username: string;
  user_type: "client" | "streamer";
  profile_picture_url: string | null;
  bio: string | null;
}