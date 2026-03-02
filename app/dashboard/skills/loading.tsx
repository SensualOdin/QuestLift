import { Skeleton } from "@/components/ui/skeleton"

export default function SkillsLoading() {
    return (
        <div className="mx-auto max-w-6xl p-4 md:p-8 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-7 w-32 bg-slate-800" />
                    <Skeleton className="h-4 w-48 bg-slate-800" />
                </div>
                <Skeleton className="h-9 w-28 rounded-lg bg-slate-800" />
            </div>

            {/* Skill tree skeleton */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="border border-slate-800/60 bg-slate-900/40 rounded-2xl p-4 space-y-3">
                        <div className="flex justify-center">
                            <Skeleton className="h-12 w-12 rounded-full bg-slate-800" />
                        </div>
                        <Skeleton className="h-4 w-20 mx-auto bg-slate-800" />
                        <Skeleton className="h-3 w-16 mx-auto bg-slate-800" />
                    </div>
                ))}
            </div>
        </div>
    )
}
