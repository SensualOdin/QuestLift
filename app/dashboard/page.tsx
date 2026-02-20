import { UserProfile } from "@/components/dashboard/user-profile"
import { RecentActivity } from "@/components/dashboard/recent-activity"
import { ActiveQuests } from "@/components/dashboard/active-quests"

export default function Home() {
  return (
    <div className="mx-auto max-w-6xl p-4 md:p-8 space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-8">
          <UserProfile />
        </div>
        <div className="lg:col-span-2 space-y-8">
          <ActiveQuests />
          <RecentActivity />
        </div>
      </div>
    </div>
  )
}
