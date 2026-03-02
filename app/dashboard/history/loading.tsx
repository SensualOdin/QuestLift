import { Skeleton } from "@/components/ui/skeleton"

export default function HistoryLoading() {
    return (
        <div className="mx-auto max-w-6xl p-4 md:p-8 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-4">
                    {/* Workout feed skeleton */}
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="border border-slate-800/60 bg-slate-900/40 rounded-2xl p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <Skeleton className="h-5 w-32 bg-slate-800" />
                                <Skeleton className="h-4 w-20 bg-slate-800" />
                            </div>
                            <Skeleton className="h-4 w-48 bg-slate-800" />
                            <div className="flex gap-3">
                                <Skeleton className="h-8 w-20 rounded-lg bg-slate-800" />
                                <Skeleton className="h-8 w-20 rounded-lg bg-slate-800" />
                                <Skeleton className="h-8 w-20 rounded-lg bg-slate-800" />
                            </div>
                        </div>
                    ))}
                </div>
                <div className="lg:col-span-1 space-y-8">
                    {/* Chart skeleton */}
                    <div className="border border-slate-800/60 bg-slate-900/40 rounded-2xl p-4 space-y-4">
                        <Skeleton className="h-5 w-32 bg-slate-800" />
                        <Skeleton className="h-48 w-full rounded-lg bg-slate-800" />
                    </div>
                </div>
            </div>
        </div>
    )
}
