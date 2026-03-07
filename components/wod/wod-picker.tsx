"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Flame, Clock, Repeat, Zap, Plus, ChevronRight } from "lucide-react"
import { fetchBenchmarkWods, fetchUserWods, type WodTemplate } from "@/lib/supabase/data-hooks"
import { useUserStore } from "@/lib/store/user-store"

const WOD_TYPE_CONFIG: Record<string, { label: string; color: string; icon: typeof Flame }> = {
    amrap: { label: 'AMRAP', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', icon: Repeat },
    for_time: { label: 'For Time', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', icon: Clock },
    emom: { label: 'EMOM', color: 'bg-rose-500/20 text-rose-400 border-rose-500/30', icon: Zap },
    chipper: { label: 'Chipper', color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: Flame },
    tabata: { label: 'Tabata', color: 'bg-pink-500/20 text-pink-400 border-pink-500/30', icon: Zap },
}

function formatTimeCap(seconds: number | null): string {
    if (!seconds) return ''
    if (seconds >= 3600) return `${Math.floor(seconds / 3600)}hr`
    return `${Math.floor(seconds / 60)} min`
}

function getWodDescription(wod: WodTemplate): string {
    const movements = wod.movements
    if (movements.length <= 2) {
        return movements.map(m => {
            const weight = m.weight_lbs ? ` (${m.weight_lbs}lb)` : ''
            return `${m.reps} ${m.exercise_name}${weight}`
        }).join(' + ')
    }
    return `${movements.length} movements`
}

interface WodPickerProps {
    onSelectWod: (wod: WodTemplate) => void
    onCreateCustom: () => void
}

export function WodPicker({ onSelectWod, onCreateCustom }: WodPickerProps) {
    const { user } = useUserStore()
    const [benchmarks, setBenchmarks] = useState<WodTemplate[]>([])
    const [customWods, setCustomWods] = useState<WodTemplate[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function load() {
            const [b, c] = await Promise.all([
                fetchBenchmarkWods(),
                user ? fetchUserWods(user.id) : Promise.resolve([]),
            ])
            setBenchmarks(b)
            setCustomWods(c)
            setLoading(false)
        }
        load()
    }, [user])

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <Button
                onClick={onCreateCustom}
                variant="outline"
                className="w-full border-dashed border-amber-500/30 bg-amber-500/5 text-amber-400 hover:bg-amber-500/10 hover:border-amber-500/50 py-5 text-base font-semibold"
            >
                <Plus className="w-5 h-5 mr-2" /> Create Custom WOD
            </Button>

            {customWods.length > 0 && (
                <div>
                    <h3 className="text-[11px] uppercase tracking-widest font-bold text-slate-400 mb-3 px-1">
                        Your WODs
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {customWods.map(wod => (
                            <WodCard key={wod.id} wod={wod} onSelect={onSelectWod} />
                        ))}
                    </div>
                </div>
            )}

            <div>
                <h3 className="text-[11px] uppercase tracking-widest font-bold text-slate-400 mb-3 px-1">
                    Benchmark WODs
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {benchmarks.map(wod => (
                        <WodCard key={wod.id} wod={wod} onSelect={onSelectWod} />
                    ))}
                </div>
            </div>
        </div>
    )
}

function WodCard({ wod, onSelect }: { wod: WodTemplate; onSelect: (wod: WodTemplate) => void }) {
    const config = WOD_TYPE_CONFIG[wod.wod_type] || WOD_TYPE_CONFIG.for_time
    const Icon = config.icon

    return (
        <Card
            className="border-slate-800/60 bg-slate-900/40 backdrop-blur-xl cursor-pointer hover:border-amber-500/30 transition-all group"
            onClick={() => onSelect(wod)}
        >
            <CardContent className="p-4 flex items-center gap-3">
                <div className={`p-2.5 rounded-lg ${config.color}`}>
                    <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{wod.name}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-semibold ${config.color}`}>
                            {config.label}
                        </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 truncate">
                        {getWodDescription(wod)}
                        {wod.time_cap_seconds ? ` \u00b7 ${formatTimeCap(wod.time_cap_seconds)}` : ''}
                    </p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-amber-400 transition-colors shrink-0" />
            </CardContent>
        </Card>
    )
}
