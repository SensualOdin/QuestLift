import { ProgressChart } from "@/components/history/progress-chart"
import { WorkoutFeed } from "@/components/history/workout-feed"

export default function HistoryPage() {
    return (
        <div className="mx-auto max-w-6xl p-4 md:p-8 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <WorkoutFeed />
                </div>
                <div className="lg:col-span-1 space-y-8">
                    <ProgressChart />
                </div>
            </div>
        </div>
    )
}
