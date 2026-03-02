import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardLoading() {
    return (
        <div className="mx-auto max-w-6xl px-3 py-4 sm:p-4 md:p-8 space-y-6 sm:space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
                <div className="lg:col-span-1 space-y-6">
                    {/* User Profile skeleton */}
                    <div className="border border-slate-800/60 bg-slate-900/60 rounded-2xl p-6 space-y-4">
                        <div className="flex flex-col items-center gap-4">
                            <Skeleton className="h-44 w-44 rounded-2xl bg-slate-800" />
                            <Skeleton className="h-6 w-32 bg-slate-800" />
                            <Skeleton className="h-4 w-24 bg-slate-800" />
                        </div>
                        <Skeleton className="h-2.5 w-full bg-slate-800 mt-6" />
                        <div className="grid grid-cols-4 gap-2 mt-4">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <Skeleton key={i} className="h-16 rounded-xl bg-slate-800" />
                            ))}
                        </div>
                    </div>
                </div>
                <div className="lg:col-span-2 space-y-6">
                    {/* Quests skeleton */}
                    <div className="border border-slate-800/60 bg-slate-900/60 rounded-2xl p-6 space-y-4">
                        <Skeleton className="h-5 w-32 bg-slate-800" />
                        {Array.from({ length: 3 }).map((_, i) => (
                            <Skeleton key={i} className="h-16 w-full rounded-xl bg-slate-800" />
                        ))}
                    </div>
                    {/* Activity skeleton */}
                    <div className="border border-slate-800/60 bg-slate-900/60 rounded-2xl p-6 space-y-4">
                        <Skeleton className="h-5 w-40 bg-slate-800" />
                        {Array.from({ length: 3 }).map((_, i) => (
                            <Skeleton key={i} className="h-12 w-full rounded-lg bg-slate-800" />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
