"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Flame, Trophy, Skull, Crown } from "lucide-react"
import { useUserStore } from "@/lib/store/user-store"
import { fetchUserParty, fetchRoastReport } from "@/lib/supabase/data-hooks"
import { Skeleton } from "@/components/ui/skeleton"
import { format, parseISO } from "date-fns"

export function RoastReport() {
    const { user } = useUserStore()
    const [report, setReport] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const loadReport = async () => {
            if (!user) return
            const partyData = await fetchUserParty(user.id)
            if (partyData) {
                const party = Array.isArray(partyData.party) ? partyData.party[0] : partyData.party
                if (party) {
                    const data = await fetchRoastReport(party.id)
                    setReport(data)
                }
            }
            setLoading(false)
        }
        loadReport()
    }, [user])

    if (loading) {
        return (
            <Card className="border-slate-800/60 bg-slate-900/40 backdrop-blur-xl">
                <CardHeader><Skeleton className="h-6 w-1/3 bg-slate-800" /></CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-20 w-full bg-slate-800" />
                    <Skeleton className="h-20 w-full bg-slate-800" />
                </CardContent>
            </Card>
        )
    }

    if (!report) {
        return (
            <Card className="border-orange-500/30 bg-orange-950/20 backdrop-blur-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-red-500" />
                <CardHeader className="pb-4 border-b border-orange-500/20">
                    <CardTitle className="text-xl font-bold flex items-center gap-2 text-orange-400">
                        <Flame className="w-5 h-5" />
                        The Roast Report
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <p className="text-sm text-slate-500 italic text-center py-4">
                        No roast reports yet. Complete a full week with your party to generate the first one.
                    </p>
                </CardContent>
            </Card>
        )
    }

    const weekLabel = report.week_start && report.week_end
        ? `${format(parseISO(report.week_start), 'MMM d')} - ${format(parseISO(report.week_end), 'MMM d')}`
        : 'This Week'

    const mvpName = report.mvp
        ? (Array.isArray(report.mvp) ? report.mvp[0]?.display_name : report.mvp?.display_name) || 'Unknown'
        : null

    const slackerName = report.slacker
        ? (Array.isArray(report.slacker) ? report.slacker[0]?.display_name : report.slacker?.display_name) || 'Unknown'
        : null

    return (
        <Card className="border-orange-500/30 bg-orange-950/20 backdrop-blur-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-red-500" />
            <CardHeader className="pb-4 border-b border-orange-500/20">
                <CardTitle className="text-xl font-bold flex items-center gap-2 text-orange-400">
                    <Flame className="w-5 h-5" />
                    The Roast Report
                </CardTitle>
                <p className="text-xs text-orange-500/70 font-medium">Week of {weekLabel}</p>
            </CardHeader>

            <CardContent className="pt-6 space-y-6">
                {/* MVP */}
                {mvpName && (
                    <div className="bg-slate-950/50 p-4 rounded-xl border border-yellow-500/30 relative">
                        <Crown className="w-6 h-6 text-yellow-500 absolute -top-3 -right-2 transform rotate-12" />
                        <h4 className="text-xs uppercase tracking-widest font-bold text-yellow-500 mb-2">The MVP (Highest XP)</h4>
                        <div className="flex justify-between items-center">
                            <span className="font-bold text-slate-200">{mvpName}</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-2 italic">Carrying the party on their shoulders. Again.</p>
                    </div>
                )}

                {/* Report Text */}
                {report.report_text && (
                    <div className="bg-slate-950/50 p-4 rounded-xl border border-indigo-500/30">
                        <h4 className="text-xs uppercase tracking-widest font-bold text-indigo-400 mb-2 flex items-center gap-1">
                            <Trophy className="w-3.5 h-3.5" /> Weekly Summary
                        </h4>
                        <p className="text-sm text-slate-300 leading-relaxed">{report.report_text}</p>
                    </div>
                )}

                {/* The Slacker */}
                {slackerName && (
                    <div className="bg-slate-950/50 p-4 rounded-xl border border-red-500/30 relative overflow-hidden">
                        <div className="absolute -right-4 -bottom-4 opacity-10">
                            <Skull className="w-24 h-24 text-red-500" />
                        </div>
                        <h4 className="text-xs uppercase tracking-widest font-bold text-red-400 mb-2">Resting at the Inn</h4>
                        <div className="flex justify-between items-center relative z-10">
                            <span className="font-bold text-slate-200">{slackerName}</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-2 italic relative z-10">The iron is getting cold, {slackerName}.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
