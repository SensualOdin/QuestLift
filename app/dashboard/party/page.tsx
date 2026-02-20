import { PartyRoster } from "@/components/social/party-roster"
import { RoastReport } from "@/components/social/roast-report"
import { PartyActivityFeed } from "@/components/social/party-activity-feed"

export default function PartyPage() {
    return (
        <div className="mx-auto max-w-6xl p-4 md:p-8 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">
                <div className="lg:col-span-2 space-y-8">
                    <PartyRoster />
                    <PartyActivityFeed />
                </div>
                <div className="lg:col-span-1 space-y-8">
                    <RoastReport />
                </div>
            </div>
        </div>
    )
}
