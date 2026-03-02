import { Skeleton } from "@/components/ui/skeleton"

export default function ShopLoading() {
    return (
        <div className="mx-auto max-w-6xl p-4 md:p-8 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-7 w-28 bg-slate-800" />
                    <Skeleton className="h-4 w-40 bg-slate-800" />
                </div>
                <Skeleton className="h-8 w-24 rounded-xl bg-slate-800" />
            </div>

            {/* Category tabs skeleton */}
            <div className="flex gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-9 w-20 rounded-full bg-slate-800" />
                ))}
            </div>

            {/* Item grid skeleton */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="border border-slate-800/60 bg-slate-900/40 rounded-2xl p-4 space-y-3">
                        <Skeleton className="h-24 w-full rounded-lg bg-slate-800" />
                        <Skeleton className="h-4 w-24 bg-slate-800" />
                        <Skeleton className="h-3 w-16 bg-slate-800" />
                        <Skeleton className="h-8 w-full rounded-lg bg-slate-800" />
                    </div>
                ))}
            </div>
        </div>
    )
}
