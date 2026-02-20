"use client"
import { useEffect } from "react"
import { motion } from "framer-motion"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Sword } from "lucide-react"
import { useUserStore } from "@/lib/store/user-store"
import { createClient } from "@/lib/supabase/client"

export function UserProfile() {
    const { user, isLoading, fetchProfile } = useUserStore()

    useEffect(() => {
        const initProfile = async () => {
            const supabase = createClient()
            const { data: { session } } = await supabase.auth.getSession()
            if (session?.user?.id) {
                await fetchProfile(session.user.id)
            }
        }
        initProfile()
    }, [fetchProfile])

    if (isLoading || !user) {
        return (
            <Card className="border-slate-800/80 bg-slate-900/60 p-6 space-y-4">
                <div className="flex flex-col items-center gap-4">
                    <Skeleton className="h-24 w-24 rounded-full bg-slate-800" />
                    <Skeleton className="h-6 w-32 bg-slate-800" />
                    <Skeleton className="h-4 w-24 bg-slate-800" />
                </div>
                <Skeleton className="h-2 w-full bg-slate-800 mt-8" />
            </Card>
        )
    }

    const level = user.level || 1
    const currentXP = user.xp_current || 0
    const xpForNextLevel = level * 1000 // Simplified formula vs the true xp-engine
    const progressPercent = Math.min((currentXP / xpForNextLevel) * 100, 100)
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <Card className="border-slate-800/80 bg-slate-900/60 backdrop-blur-2xl overflow-hidden relative shadow-2xl">
                {/* Decorative background glow */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

                <CardHeader className="pb-4 relative z-10 border-b border-slate-800/50">
                    <div className="flex flex-col items-center gap-4 pt-2">
                        <div className="relative group cursor-pointer">
                            <div className="absolute inset-0 bg-indigo-500 rounded-full blur opacity-20 group-hover:opacity-40 transition-opacity" />
                            <Avatar className="h-24 w-24 border-2 border-indigo-500/50 relative">
                                <AvatarImage src="https://github.com/shadcn.png" />
                                <AvatarFallback>{user.display_name.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="absolute -bottom-2 right-0 left-0 mx-auto w-fit bg-slate-900 text-white text-xs font-bold px-3 py-1 rounded-full border border-indigo-500/50 shadow-lg">
                                Lvl {level}
                            </div>
                        </div>
                        <div className="text-center">
                            <CardTitle className="text-2xl font-bold text-white tracking-tight">{user.display_name}</CardTitle>
                            <p className="text-sm text-indigo-400 font-medium mt-1 flex items-center justify-center gap-1.5">
                                <Sword className="w-3.5 h-3.5" /> Class: {user.class_name || 'Novice'}
                            </p>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="space-y-6 pt-6 relative z-10">
                    {/* XP Bar */}
                    <div>
                        <div className="flex justify-between text-sm mb-2 font-medium">
                            <span className="text-slate-400 uppercase tracking-wider text-[10px]">Experience</span>
                            <span className="text-indigo-300 text-xs">{currentXP} / {xpForNextLevel} XP</span>
                        </div>
                        <div className="relative h-2.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${progressPercent}%` }}
                                transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                                className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                            />
                        </div>
                        <p className="text-[10px] text-slate-500 mt-2 text-right uppercase tracking-wider font-semibold">
                            {xpForNextLevel - currentXP} XP to Level {level + 1}
                        </p>
                    </div>

                    {/* Attributes */}
                    <div className="pt-4 border-t border-slate-800/60">
                        <h4 className="text-[10px] uppercase tracking-widest font-semibold text-slate-500 mb-4 px-1">Core Attributes</h4>
                        <div className="grid grid-cols-3 gap-2">
                            <div className="bg-slate-950/50 border border-slate-800/60 rounded-xl p-3 text-center transition-colors hover:bg-slate-900">
                                <div className="text-red-400 text-xs font-bold mb-1">STR</div>
                                <div className="text-xl font-mono text-slate-200" title="Lifetime Volume">
                                    {(user.str_volume_lifetime || 0) > 1000
                                        ? `${((user.str_volume_lifetime || 0) / 1000).toFixed(1)}k`
                                        : user.str_volume_lifetime || 0}
                                </div>
                            </div>
                            <div className="bg-slate-950/50 border border-slate-800/60 rounded-xl p-3 text-center transition-colors hover:bg-slate-900">
                                <div className="text-emerald-400 text-xs font-bold mb-1">DEX</div>
                                <div className="text-xl font-mono text-slate-200" title="Lifetime Cardio Minutes">
                                    {user.dex_minutes_lifetime || 0}
                                </div>
                            </div>
                            <div className="bg-slate-950/50 border border-slate-800/60 rounded-xl p-3 text-center transition-colors hover:bg-slate-900">
                                <div className="text-blue-400 text-xs font-bold mb-1">CON</div>
                                <div className="text-xl font-mono text-slate-200" title="Lifetime Sets">
                                    {user.con_sets_lifetime || 0}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Inventory Summary */}
                    <div className="flex items-center justify-between px-1 pt-2">
                        <span className="text-xs font-medium text-slate-400 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-yellow-600 shadow-[0_0_8px_rgba(202,138,4,0.6)]" />
                            Iron Scraps
                        </span>
                        <span className="text-sm font-bold text-yellow-500">{user.iron_scraps || 0}</span>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    )
}
