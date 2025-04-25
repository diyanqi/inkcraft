import type { Session } from "next-auth"
 
export function UserAvatar({ session }: { session: Session | null }) {
  return (
    <div>
      <img
        src={session?.user?.image ?? "https://i.pravatar.cc/300"}
        alt="User Avatar"
      />
    </div>
  )
}