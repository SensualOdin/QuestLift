"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Users, Link, Shield, Sword, Wind, UserPlus, Crown, Copy, LogOut, Trash2 } from "lucide-react"
import { useUserStore } from "@/lib/store/user-store"
import { fetchUserParty, joinPartyByCode, disbandParty, leaveParty } from "@/lib/supabase/data-hooks"
import { useRealtimePartyRoster } from "@/lib/supabase/realtime-hooks"
import { Skeleton } from "@/components/ui/skeleton"
import { createClient } from "@/lib/supabase/client"

export function PartyRoster() {
    const { user } = useUserStore()
    const [inviteCopied, setInviteCopied] = useState(false)
    const [codeCopied, setCodeCopied] = useState(false)
    const [party, setParty] = useState<any>(null)
    const [roster, setRoster] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [joinCode, setJoinCode] = useState("")
    const [joinError, setJoinError] = useState("")
    const [isJoining, setIsJoining] = useState(false)
    const [isCreating, setIsCreating] = useState(false)
    const [createError, setCreateError] = useState("")
    const [isDisbanding, setIsDisbanding] = useState(false)
    const [isLeaving, setIsLeaving] = useState(false)
    const [confirmDisband, setConfirmDisband] = useState(false)

    const loadParty = async () => {
        if (!user) return
        const partyData = await fetchUserParty(user.id)
        if (partyData) {
            setParty(Array.isArray(partyData.party) ? partyData.party[0] : partyData.party)
            setRoster(partyData.roster)
        } else {
            setParty(null)
            setRoster([])
        }
        setLoading(false)
    }

    useEffect(() => {
        loadParty()
    }, [user])

    // Live updates when members join or leave
    useRealtimePartyRoster(party?.id, loadParty)

    const handleCopyInvite = () => {
        if (party?.join_code) {
            navigator.clipboard.writeText(`${window.location.origin}/invite/${party.join_code}`)
            setInviteCopied(true)
            setTimeout(() => setInviteCopied(false), 2000)
        }
    }

    const handleCopyCode = () => {
        if (party?.join_code) {
            navigator.clipboard.writeText(party.join_code)
            setCodeCopied(true)
            setTimeout(() => setCodeCopied(false), 2000)
        }
    }

    const handleCreateParty = async () => {
        if (!user) return
        setIsCreating(true)
        setCreateError("")

        const supabase = createClient()

        // Check if already in a party
        const { data: existing } = await supabase
            .from('party_members')
            .select('party_id')
            .eq('user_id', user.id)
            .limit(1)
            .maybeSingle()

        if (existing) {
            await loadParty()
            setIsCreating(false)
            return
        }

        const partyId = crypto.randomUUID()
        const code = `p-${Math.random().toString(36).substring(2, 6).toUpperCase()}`

        const { error: pError } = await supabase
            .from('parties')
            .insert({ id: partyId, name: 'New Adventure Party', join_code: code })

        if (pError) {
            console.error('Create party error:', pError)
            setCreateError(pError.message || 'Failed to create party.')
            setIsCreating(false)
            return
        }

        const { error: mError } = await supabase.from('party_members').insert({
            party_id: partyId,
            user_id: user.id,
            role: 'leader'
        })

        if (mError) {
            console.error('Join party error:', mError)
            setCreateError(mError.message || 'Party created but failed to join.')
        }

        await loadParty()
        setIsCreating(false)
    }

    const handleJoinParty = async () => {
        if (!user || !joinCode.trim()) return
        setIsJoining(true)
        setJoinError("")

        const result = await joinPartyByCode(user.id, joinCode)
        if (result.success) {
            await loadParty()
        } else {
            setJoinError(result.error || 'Failed to join party.')
        }
        setIsJoining(false)
    }

    const handleDisband = async () => {
        if (!user || !party) return
        if (!confirmDisband) {
            setConfirmDisband(true)
            setTimeout(() => setConfirmDisband(false), 4000)
            return
        }
        setIsDisbanding(true)
        const result = await disbandParty(user.id, party.id)
        if (result.success) {
            setParty(null)
            setRoster([])
            setConfirmDisband(false)
        }
        setIsDisbanding(false)
    }

    const handleLeave = async () => {
        if (!user || !party) return
        setIsLeaving(true)
        const result = await leaveParty(user.id, party.id)
        if (result.success) {
            setParty(null)
            setRoster([])
        }
        setIsLeaving(false)
    }

    const isLeader = roster.find(m => m.user_id === user?.id)?.role === 'leader'

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
                <Users className="w-12 h-12 text-slate-400 mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-bold text-white mb-2">No Active Party</h3>
                <p className="text-slate-400 text-sm mb-6">You must brave the dungeons alone, or form a party of adventurers.</p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Button onClick={handleCreateParty} disabled={isCreating} className="bg-indigo-600 hover:bg-indigo-700 text-white w-full sm:w-auto">
                        <Users className="w-4 h-4 mr-2" /> {isCreating ? "Creating..." : "Create Party"}
                    </Button>
                    <div className="flex flex-col gap-2 w-full sm:w-auto">
                        <div className="flex gap-2">
                            <Input
                                placeholder="Enter Join Code"
                                value={joinCode}
                                onChange={(e) => setJoinCode(e.target.value)}
                                className="bg-slate-950 border-slate-800 text-center w-full"
                            />
                            <Button
                                variant="secondary"
                                className="bg-slate-800 text-white hover:bg-slate-700"
                                onClick={handleJoinParty}
                                disabled={isJoining || !joinCode.trim()}
                            >
                                {isJoining ? "Joining..." : "Join"}
                            </Button>
                        </div>
                        {joinError && <p className="text-xs text-red-400">{joinError}</p>}
                        {createError && <p className="text-xs text-red-400">{createError}</p>}
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
                    {party.name || 'Your Party'} <span className="text-xs font-normal text-slate-400 ml-2">({roster.length}/5 Members)</span>
                </CardTitle>
            </CardHeader>

            <CardContent className="pt-6 space-y-6">

                {/* Join Code Display */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/50 border border-slate-800/60">
                    <div className="flex-1">
                        <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-1">Join Code</p>
                        <p className="text-lg font-mono font-bold text-indigo-400 tracking-widest">{party.join_code}</p>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCopyCode}
                        className={codeCopied ? "text-emerald-400" : "text-slate-400 hover:text-white"}
                    >
                        <Copy className="w-4 h-4 mr-1.5" />
                        {codeCopied ? "Copied!" : "Code"}
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCopyInvite}
                        className={inviteCopied ? "text-emerald-400" : "text-slate-400 hover:text-white"}
                    >
                        <Link className="w-4 h-4 mr-1.5" />
                        {inviteCopied ? "Copied!" : "Link"}
                    </Button>
                </div>

                {/* Members List */}
                <div className="space-y-3">
                    {roster.map(member => {
                        const mUser = Array.isArray(member.users) ? member.users[0] : member.users
                        if (!mUser) return null

                        const Icon = getIcon(mUser.class_name)
                        const memberIsLeader = member.role === 'leader'
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
                                        <div className="absolute -bottom-1 -right-1 bg-slate-900 text-[11px] font-bold px-1.5 py-0.5 rounded-md border border-slate-700 text-slate-300">
                                            Lvl {mUser.level || 1}
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-slate-200 flex items-center gap-1.5">
                                            {name}
                                            {memberIsLeader && <Crown className="w-3.5 h-3.5 text-yellow-500" />}
                                        </h4>
                                        <p className={`text-xs font-medium flex items-center gap-1 text-slate-400`}>
                                            <Icon className="w-3 h-3" /> {mUser.class_name || 'Novice'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* Party Actions */}
                <div className="pt-4 border-t border-slate-800/60">
                    {isLeader ? (
                        <Button
                            variant="ghost"
                            onClick={handleDisband}
                            disabled={isDisbanding}
                            className={`w-full ${confirmDisband ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'text-slate-500 hover:text-red-400 hover:bg-red-500/10'}`}
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            {isDisbanding ? "Disbanding..." : confirmDisband ? "Are you sure? Click again to confirm" : "Disband Party"}
                        </Button>
                    ) : (
                        <Button
                            variant="ghost"
                            onClick={handleLeave}
                            disabled={isLeaving}
                            className="w-full text-slate-500 hover:text-red-400 hover:bg-red-500/10"
                        >
                            <LogOut className="w-4 h-4 mr-2" />
                            {isLeaving ? "Leaving..." : "Leave Party"}
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
