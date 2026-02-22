import { UserProfile } from "@/components/dashboard/user-profile"
import { RecentActivity } from "@/components/dashboard/recent-activity"
import { ActiveQuests } from "@/components/dashboard/active-quests"
import { AdventurersGuild } from "@/components/dashboard/adventurers-guild"
import { OnboardingCheck } from "@/components/dashboard/onboarding-check"

export default function Home() {
  return (
    <div className="mx-auto max-w-6xl px-3 py-4 sm:p-4 md:p-8 space-y-6 sm:space-y-8">
      <OnboardingCheck />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        <div className="lg:col-span-1 space-y-6 sm:space-y-8">
          <UserProfile />
        </div>
        <div className="lg:col-span-2 space-y-6 sm:space-y-8">
          <ActiveQuests />
          <AdventurersGuild />
          <RecentActivity />
        </div>
      </div>
    </div>
  )
}
