"use client"

import { useEffect, useState } from "react"
import { Coins, Check, ShoppingBag, Sparkles, Crown, Star, Gem } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useUserStore } from "@/lib/store/user-store"
import { createClient } from "@/lib/supabase/client"
import { fetchShopItems, purchaseShopItem, equipShopItem } from "@/lib/supabase/data-hooks"

interface ShopItem {
    id: string
    name: string
    type: 'title' | 'frame'
    cost: number
    rarity: string
    description: string
    preview_value: string
    owned: boolean
}

const RARITY_CONFIG: Record<string, { color: string, bg: string, border: string, icon: typeof Star }> = {
    common: { color: 'text-slate-400', bg: 'bg-slate-400/10', border: 'border-slate-700', icon: Star },
    rare: { color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-500/30', icon: Gem },
    epic: { color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-500/30', icon: Sparkles },
    legendary: { color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-500/30', icon: Crown },
}

export default function ShopPage() {
    const { user, refreshProfile } = useUserStore()
    const [items, setItems] = useState<ShopItem[]>([])
    const [loading, setLoading] = useState(true)
    const [purchasing, setPurchasing] = useState<string | null>(null)
    const [equippedTitle, setEquippedTitle] = useState<string | null>(null)
    const [equippedFrame, setEquippedFrame] = useState<string | null>(null)

    useEffect(() => {
        const init = async () => {
            const supabase = createClient()
            const { data: { session } } = await supabase.auth.getSession()
            if (!session?.user?.id) return

            const shopItems = await fetchShopItems(session.user.id)
            setItems(shopItems as ShopItem[])
            setLoading(false)
        }
        init()
    }, [])

    useEffect(() => {
        if (user) {
            setEquippedTitle(user.equipped_title || null)
            setEquippedFrame(user.equipped_frame || null)
        }
    }, [user])

    const handlePurchase = async (item: ShopItem) => {
        if (!user || purchasing) return
        setPurchasing(item.id)

        const result = await purchaseShopItem(user.id, item.id, item.cost)
        if (result.success) {
            setItems(prev => prev.map(i => i.id === item.id ? { ...i, owned: true } : i))
            await refreshProfile()
        } else {
            alert(result.error || 'Purchase failed')
        }
        setPurchasing(null)
    }

    const handleEquip = async (item: ShopItem) => {
        if (!user) return
        const currentEquipped = item.type === 'title' ? equippedTitle : equippedFrame
        const newValue = currentEquipped === item.preview_value ? null : item.preview_value

        const success = await equipShopItem(user.id, item.type, newValue)
        if (success) {
            if (item.type === 'title') setEquippedTitle(newValue)
            else setEquippedFrame(newValue)
            await refreshProfile()
        }
    }

    const titles = items.filter(i => i.type === 'title')
    const frames = items.filter(i => i.type === 'frame')
    const balance = user?.iron_scraps || 0

    if (loading) {
        return (
            <div className="mx-auto max-w-4xl px-3 py-4 sm:p-4 md:p-8">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 w-48 bg-slate-800 rounded" />
                    <div className="grid grid-cols-2 gap-3">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="h-40 bg-slate-800/60 rounded-xl" />
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="mx-auto max-w-4xl px-3 py-4 sm:p-4 md:p-8 space-y-6">
            {/* Header with balance */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <ShoppingBag className="w-6 h-6 text-indigo-400" /> Shop
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">Spend your hard-earned Iron Scraps</p>
                </div>
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2 flex items-center gap-2">
                    <Coins className="w-5 h-5 text-yellow-500" />
                    <span className="text-lg font-bold text-yellow-500">{balance}</span>
                </div>
            </div>

            {/* Titles Section */}
            <div className="space-y-3">
                <h2 className="text-[10px] uppercase tracking-widest font-semibold text-slate-500 px-1">Titles</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {titles.map(item => {
                        const config = RARITY_CONFIG[item.rarity] || RARITY_CONFIG.common
                        const RarityIcon = config.icon
                        const isEquipped = equippedTitle === item.preview_value

                        return (
                            <Card key={item.id} className={`${config.border} bg-slate-900/40 overflow-hidden`}>
                                <CardContent className="p-4 space-y-3">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <div className="flex items-center gap-1.5">
                                                <RarityIcon className={`w-4 h-4 ${config.color}`} />
                                                <h3 className={`font-bold ${config.color}`}>{item.name}</h3>
                                            </div>
                                            <p className="text-xs text-slate-500 mt-1">{item.description}</p>
                                        </div>
                                        <span className={`text-[10px] uppercase tracking-wider font-bold ${config.color} ${config.bg} px-2 py-0.5 rounded-full`}>
                                            {item.rarity}
                                        </span>
                                    </div>

                                    {item.owned ? (
                                        <Button
                                            onClick={() => handleEquip(item)}
                                            variant={isEquipped ? "default" : "outline"}
                                            className={`w-full ${isEquipped ? 'bg-indigo-600 hover:bg-indigo-700' : 'border-slate-700'}`}
                                            size="sm"
                                        >
                                            {isEquipped ? <><Check className="w-4 h-4 mr-1" /> Equipped</> : 'Equip'}
                                        </Button>
                                    ) : (
                                        <Button
                                            onClick={() => handlePurchase(item)}
                                            disabled={balance < item.cost || purchasing === item.id}
                                            className="w-full bg-yellow-600 hover:bg-yellow-700 active:bg-yellow-700 text-white"
                                            size="sm"
                                        >
                                            <Coins className="w-4 h-4 mr-1" />
                                            {purchasing === item.id ? 'Buying...' : `${item.cost} Scraps`}
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            </div>

            {/* Frames Section */}
            <div className="space-y-3">
                <h2 className="text-[10px] uppercase tracking-widest font-semibold text-slate-500 px-1">Portrait Frames</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {frames.map(item => {
                        const config = RARITY_CONFIG[item.rarity] || RARITY_CONFIG.common
                        const RarityIcon = config.icon
                        const isEquipped = equippedFrame === item.preview_value

                        return (
                            <Card key={item.id} className={`${config.border} bg-slate-900/40 overflow-hidden`}>
                                <CardContent className="p-4 space-y-3">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <div className="flex items-center gap-1.5">
                                                <RarityIcon className={`w-4 h-4 ${config.color}`} />
                                                <h3 className={`font-bold ${config.color}`}>{item.name}</h3>
                                            </div>
                                            <p className="text-xs text-slate-500 mt-1">{item.description}</p>
                                        </div>
                                        <span className={`text-[10px] uppercase tracking-wider font-bold ${config.color} ${config.bg} px-2 py-0.5 rounded-full`}>
                                            {item.rarity}
                                        </span>
                                    </div>

                                    {/* Frame preview */}
                                    <div className="flex justify-center">
                                        <div className={`w-16 h-16 rounded-lg bg-slate-950 ${getFramePreview(item.preview_value)}`} />
                                    </div>

                                    {item.owned ? (
                                        <Button
                                            onClick={() => handleEquip(item)}
                                            variant={isEquipped ? "default" : "outline"}
                                            className={`w-full ${isEquipped ? 'bg-indigo-600 hover:bg-indigo-700' : 'border-slate-700'}`}
                                            size="sm"
                                        >
                                            {isEquipped ? <><Check className="w-4 h-4 mr-1" /> Equipped</> : 'Equip'}
                                        </Button>
                                    ) : (
                                        <Button
                                            onClick={() => handlePurchase(item)}
                                            disabled={balance < item.cost || purchasing === item.id}
                                            className="w-full bg-yellow-600 hover:bg-yellow-700 active:bg-yellow-700 text-white"
                                            size="sm"
                                        >
                                            <Coins className="w-4 h-4 mr-1" />
                                            {purchasing === item.id ? 'Buying...' : `${item.cost} Scraps`}
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

function getFramePreview(frame: string): string {
    switch (frame) {
        case 'bronze': return 'border-2 border-amber-700 shadow-[0_0_8px_rgba(180,83,9,0.4)]'
        case 'silver': return 'border-2 border-slate-400 shadow-[0_0_8px_rgba(148,163,184,0.4)]'
        case 'gold': return 'border-2 border-yellow-500 shadow-[0_0_12px_rgba(234,179,8,0.5)]'
        case 'flame': return 'border-2 border-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.5)]'
        case 'legendary': return 'border-2 border-purple-400 shadow-[0_0_16px_rgba(192,132,252,0.6)]'
        default: return 'border-2 border-slate-700'
    }
}
