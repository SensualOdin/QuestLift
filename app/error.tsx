"use client"

import { useEffect } from "react"
import { AlertTriangle, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error("Global error:", error)
    }, [error])

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
            <div className="max-w-md w-full text-center space-y-6">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                    <AlertTriangle className="w-8 h-8 text-red-400" />
                </div>
                <div className="space-y-2">
                    <h1 className="text-2xl font-bold text-white font-cinzel">Quest Failed</h1>
                    <p className="text-slate-400 text-sm">
                        Something went wrong. The dungeon collapsed, but your progress is safe.
                    </p>
                </div>
                <Button
                    onClick={reset}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Try Again
                </Button>
            </div>
        </div>
    )
}
