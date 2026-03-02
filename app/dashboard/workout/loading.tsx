import { Skeleton } from "@/components/ui/skeleton"

export default function WorkoutLoading() {
    return (
        <div className="mx-auto max-w-4xl p-4 md:p-8 space-y-6">
            {/* Header skeleton */}
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-7 w-40 bg-slate-800" />
                    <Skeleton className="h-4 w-24 bg-slate-800" />
                </div>
                <Skeleton className="h-10 w-24 rounded-xl bg-slate-800" />
            </div>

            {/* Template picker skeleton */}
            <Skeleton className="h-12 w-full rounded-xl bg-slate-800" />

            {/* Exercise cards skeleton */}
            {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="border border-slate-800/60 bg-slate-900/40 rounded-2xl overflow-hidden">
                    <div className="p-4 bg-slate-900/80 border-b border-slate-800/60 flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-lg bg-slate-800" />
                        <div className="space-y-2">
                            <Skeleton className="h-5 w-32 bg-slate-800" />
                            <Skeleton className="h-3 w-20 bg-slate-800" />
                        </div>
                    </div>
                    <div className="p-4 space-y-3">
                        {Array.from({ length: 3 }).map((_, j) => (
                            <Skeleton key={j} className="h-11 w-full rounded-xl bg-slate-800" />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    )
}
