import { User } from "@/types/user";

interface UserProfileProps {
  user: User;
}

export function UserProfile({ user }: UserProfileProps) {
  return (
    <div>
      <h2>{user.first_name} {user.last_name}</h2>
      <p>Username: {user.username}</p>
      <p>Email: {user.email}</p>
      {/* Other user information */}
    </div>
  );
}