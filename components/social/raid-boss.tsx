"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Swords, Skull, Shield } from "lucide-react"
import { useUserStore } from "@/lib/store/user-store"
import { fetchUserParty, fetchActiveRaid } from "@/lib/supabase/data-hooks"
import { Skeleton } from "@/components/ui/skeleton"
import { differenceInDays, differenceInHours, parseISO } from "date-fns"

export function RaidBoss() {
    const { user } = useUserStore()
    const [raid, setRaid] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const loadRaid = async () => {
            if (!user) return
            const partyData = await fetchUserParty(user.id)

            if (partyData && partyData.party) {
                const party = Array.isArray(partyData.party) ? partyData.party[0] : partyData.party
                if (party) {
                    const activeRaid = await fetchActiveRaid(party.id)
                    setRaid(activeRaid)
                }
            }
            setLoading(false)
        }
        loadRaid()
    }, [user])

    if (loading) {
        return <Skeleton className="h-96 w-full bg-slate-800/50 rounded-xl" />
    }

    if (!raid) {
        return (
            <Card className="border-slate-800/60 bg-slate-900/40 backdrop-blur-xl text-center p-8">
                <Shield className="w-12 h-12 text-slate-500 mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-bold text-white mb-2">No Active Raid</h3>
                <p className="text-slate-400 text-sm">Your party is currently resting. A new Raid Boss will spawn soon.</p>
            </Card>
        )
    }

    const hpFull = raid.boss_max_hp || 250000

    // Calculate total damage from all members
    let totalDamage = 0
    const contributions = (raid.raid_damage || []).map((dmgRec: any) => {
        const dmg = dmgRec.damage || 0
        totalDamage += dmg
        const userObj = Array.isArray(dmgRec.users) ? dmgRec.users[0] : dmgRec.users
        return {
            name: userObj?.display_name || "Unknown",
            dmg: dmg,
            // Assign a random color if needed, but since we can't easily map, just use static colors for MVP
        }
    }).sort((a: any, b: any) => b.dmg - a.dmg) // Rank by damage

    // Assign generic team colors
    const colors = ["bg-red-500", "bg-blue-500", "bg-emerald-500", "bg-amber-500", "bg-purple-500"]
    contributions.forEach((c: any, i: number) => {
        c.color = colors[i % colors.length]
    })

    const hpCurrent = Math.max(0, hpFull - totalDamage)
    const hpPercent = (hpCurrent / hpFull) * 100
    const damageTaken = hpFull - hpCurrent

    // Calculate time remaining
    let timeRemaining = "Unknown"
    if (raid.end_time) {
        const end = parseISO(raid.end_time)
        const days = differenceInDays(end, new Date())
        const hours = differenceInHours(end, new Date()) % 24
        timeRemaining = `${days > 0 ? days + 'd ' : ''}${hours}h`
    }

    return (
        <Card className="border-red-900/50 bg-slate-950/80 backdrop-blur-xl relative overflow-hidden group">
            {/* Background Boss Visual */}
            <div className="absolute inset-x-0 -top-24 h-64 bg-red-900/10 rounded-full blur-3xl pointer-events-none transition-all duration-1000 group-hover:bg-red-800/20" />

            <CardHeader className="relative z-10 border-b border-red-900/30">
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400 font-serif tracking-wide">
                            {raid.boss_name || "Unknown Entity"}
                        </CardTitle>
                        <p className="text-xs text-red-400 flex items-center gap-1 mt-1 font-mono uppercase tracking-widest">
                            <Skull className="w-3.5 h-3.5" /> Enrages in {timeRemaining}
                        </p>
                    </div>
                    <div className="w-12 h-12 bg-slate-900 border-2 border-red-500/50 rounded-lg flex items-center justify-center text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]">
                        <Swords className="w-6 h-6" />
                    </div>
                </div>
            </CardHeader>

            <CardContent className="pt-6 relative z-10 space-y-6">

                {/* Boss HP Bar */}
                <div>
                    <div className="flex justify-between text-xs font-bold font-mono tracking-widest uppercase mb-2">
                        <span className="text-red-400">Boss HP</span>
                        <span className="text-red-300">{hpCurrent.toLocaleString()} / {hpFull.toLocaleString()}</span>
                    </div>

                    <div className="relative h-4 w-full bg-slate-900 rounded-sm overflow-hidden border-2 border-red-950">
                        {/* Remaining HP */}
                        <div
                            className="absolute top-0 right-0 h-full bg-red-600 transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(220,38,38,0.8)]"
                            style={{ width: `${hpPercent}%` }}
                        />
                        {/* Damage Portions */}
                        <div className="absolute top-0 left-0 h-full flex" style={{ width: `${100 - hpPercent}%` }}>
                            {contributions.map((c: any, i: number) => {
                                const percentOfDamage = damageTaken > 0 ? (c.dmg / damageTaken) * 100 : 0
                                return (
                                    <div
                                        key={i}
                                        className={`h-full opacity-60 ${c.color} border-r border-slate-900/50`}
                                        style={{ width: `${percentOfDamage}%` }}
                                        title={`${c.name}: ${c.dmg.toLocaleString()} DMG`}
                                    />
                                )
                            })}
                        </div>
                    </div>
                </div>

                {/* Party Contributions */}
                <div className="pt-2">
                    <h4 className="text-xs uppercase tracking-widest font-bold text-slate-500 mb-3 border-b border-slate-800 pb-2">
                        Damage Contributions
                    </h4>
                    {contributions.length === 0 ? (
                        <p className="text-xs text-slate-500 italic">No damage dealt yet. Log a workout!</p>
                    ) : (
                        <div className="space-y-3">
                            {contributions.map((member: any, i: number) => (
                                <div key={i} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2.5 h-2.5 rounded-full ${member.color}`} />
                                        <span className="text-slate-300 font-medium">{member.name}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs text-slate-500 font-mono">
                                            {hpFull > 0 ? Math.round((member.dmg / hpFull) * 100) : 0}%
                                        </span>
                                        <span className="font-mono text-slate-200 font-bold w-20 text-right">
                                            {member.dmg.toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </CardContent>

            <CardFooter className="bg-red-950/20 border-t border-red-900/30 p-4">
                <p className="text-xs text-slate-400 text-center w-full leading-relaxed">
                    Log workouts to deal damage. 1 lb lifted = 1 DMG.<br />
                    Cardio at RPE 8+ = 50 DMG/min. Defeat the boss for rare loot.
                </p>
            </CardFooter>
        </Card>
    )
}
