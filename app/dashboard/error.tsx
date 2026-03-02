"use client"

import { useEffect } from "react"
import { Skull, RotateCcw, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function DashboardError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error("Dashboard error:", error)
    }, [error])

    return (
        <div className="mx-auto max-w-6xl px-3 py-8 sm:p-8">
            <div className="max-w-md mx-auto text-center space-y-6">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                    <Skull className="w-8 h-8 text-red-400" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-white font-cinzel">Quest Failed</h2>
                    <p className="text-slate-400 text-sm">
                        An error interrupted your adventure. Fear not — your XP and progress are safe.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button
                        onClick={reset}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                    >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Retry
                    </Button>
                    <Button variant="outline" asChild className="border-slate-700 text-slate-300 hover:text-white">
                        <Link href="/dashboard">
                            <Home className="w-4 h-4 mr-2" />
                            Return to Inn
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    )
}
