"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Users, Link, Shield, Sword, Wind, Flame, UserPlus } from "lucide-react"
import { useUserStore } from "@/lib/store/user-store"
import { fetchUserParty } from "@/lib/supabase/data-hooks"
import { Skeleton } from "@/components/ui/skeleton"
import { createClient } from "@/lib/supabase/client"

export function PartyRoster() {
    const { user } = useUserStore()
    const [inviteCopied, setInviteCopied] = useState(false)
    const [party, setParty] = useState<any>(null)
    const [roster, setRoster] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const loadParty = async () => {
        if (!user) return
        const partyData = await fetchUserParty(user.id)
        if (partyData) {
            setParty(Array.isArray(partyData.party) ? partyData.party[0] : partyData.party)
            setRoster(partyData.roster)
        }
        setLoading(false)
    }

    useEffect(() => {
        loadParty()
    }, [user])

    const handleCopyInvite = () => {
        if (party?.join_code) {
            navigator.clipboard.writeText(`questfit.app/invite/${party.join_code}`)
            setInviteCopied(true)
            setTimeout(() => setInviteCopied(false), 2000)
        }
    }

    const handleCreateParty = async () => {
        if (!user) return

        const supabase = createClient()
        const joinCode = `p-${Math.random().toString(36).substring(2, 6).toUpperCase()}`

        const { data: newParty, error: pError } = await supabase
            .from('parties')
            .insert({ name: 'New Adventure Party', join_code: joinCode })
            .select()
            .single()

        if (newParty && !pError) {
            await supabase.from('party_members').insert({
                party_id: newParty.id,
                user_id: user.id
            })
            await loadParty()
        }
    }

    const getIcon = (className: string) => {
        if (!className) return Sword
        if (className.includes("Tank")) return Shield
        if (className.includes("Rogue")) return Wind
        return Sword
    }

    if (loading) {
        return (
            <Card className="border-slate-800/60 bg-slate-900/40 backdrop-blur-xl">
                <CardHeader><Skeleton className="h-6 w-1/3 bg-slate-800" /></CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-16 w-full bg-slate-800" />
                    <Skeleton className="h-16 w-full bg-slate-800" />
                </CardContent>
            </Card>
        )
    }

    if (!party) {
        return (
            <Card className="border-slate-800/60 bg-slate-900/40 backdrop-blur-xl text-center p-8">
                <Users className="w-12 h-12 text-slate-500 mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-bold text-white mb-2">No Active Party</h3>
                <p className="text-slate-400 text-sm mb-6">You must brave the dungeons alone, or form a party of adventurers.</p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Button onClick={handleCreateParty} className="bg-indigo-600 hover:bg-indigo-700 text-white w-full sm:w-auto">
                        <Users className="w-4 h-4 mr-2" /> Create Party
                    </Button>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <Input placeholder="Enter Join Code" className="bg-slate-950 border-slate-800 text-center w-full" />
                        <Button variant="secondary" className="bg-slate-800 text-white hover:bg-slate-700">Join</Button>
                    </div>
                </div>
            </Card>
        )
    }

    return (
        <Card className="border-slate-800/60 bg-slate-900/40 backdrop-blur-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-slate-800/60">
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <Users className="w-5 h-5 text-indigo-400" />
                    {party.name || 'Your Party'} <span className="text-xs font-normal text-slate-500 ml-2">({roster.length}/5 Members)</span>
                </CardTitle>
            </CardHeader>

            <CardContent className="pt-6 space-y-6">

                {/* Members List */}
                <div className="space-y-3">
                    {roster.map(member => {
                        const mUser = Array.isArray(member.users) ? member.users[0] : member.users
                        if (!mUser) return null

                        const Icon = getIcon(mUser.class_name)
                        const name = user?.id === member.user_id ? `${mUser.display_name} (You)` : mUser.display_name

                        return (
                            <div key={member.user_id} className="flex items-center justify-between p-3 rounded-xl bg-slate-950/50 border border-slate-800/60 hover:bg-slate-900/80 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <Avatar className="h-12 w-12 border border-slate-700">
                                            <AvatarFallback className="bg-slate-800 text-slate-300">
                                                {mUser.display_name?.substring(0, 2).toUpperCase() || '??'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="absolute -bottom-1 -right-1 bg-slate-900 text-[10px] font-bold px-1.5 py-0.5 rounded-md border border-slate-700 text-slate-300">
                                            Lvl {mUser.level || 1}
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-slate-200">{name}</h4>
                                        <p className={`text-xs font-medium flex items-center gap-1 text-slate-400`}>
                                            <Icon className="w-3 h-3" /> {mUser.class_name || 'Novice'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* Invite Generator */}
                <div className="pt-6 border-t border-slate-800/60 space-y-3">
                    <h4 className="text-sm font-semibold text-slate-300">Recruit New Members</h4>
                    <div className="flex items-center gap-2">
                        <Input
                            readOnly
                            value={`questfit.app/invite/${party.join_code || 'ERROR'}`}
                            className="bg-slate-950 border-slate-800 text-slate-400 font-mono text-sm"
                        />
                        <Button
                            variant="secondary"
                            onClick={handleCopyInvite}
                            className={`${inviteCopied ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20' : 'bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30'}`}
                        >
                            <Link className="w-4 h-4 mr-2" />
                            {inviteCopied ? 'Copied!' : 'Copy'}
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
