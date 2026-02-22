"use client"

import { useEffect, useState } from "react"
import { Coins, Check, ShoppingBag, Sparkles, Crown, Star, Gem, Sword, Shield, FlaskRound, Scroll, Package } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useUserStore } from "@/lib/store/user-store"
import { createClient } from "@/lib/supabase/client"
import { fetchShopItems, purchaseShopItem, equipShopItem, fetchShopEquipment, purchaseEquipment } from "@/lib/supabase/data-hooks"
import { motion, AnimatePresence } from "framer-motion"

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

interface Equipment {
    id: string
    name: string
    description: string
    slot: string
    rarity: string
    effect_type: string
    effect_value: number
    effect_target: string | null
    icon: string
    cost: number
}

type Tab = 'cosmetics' | 'equipment' | 'consumables'

const RARITY_CONFIG: Record<string, { color: string, bg: string, border: string, glow: string, icon: typeof Star }> = {
    common: { color: 'text-slate-400', bg: 'bg-slate-400/10', border: 'border-slate-700', glow: '', icon: Star },
    rare: { color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-500/30', glow: 'shadow-[0_0_8px_rgba(59,130,246,0.15)]', icon: Gem },
    epic: { color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-500/30', glow: 'shadow-[0_0_12px_rgba(168,85,247,0.2)]', icon: Sparkles },
    legendary: { color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-500/30', glow: 'shadow-[0_0_16px_rgba(234,179,8,0.25)]', icon: Crown },
}

const SLOT_ICONS: Record<string, typeof Sword> = { weapon: Sword, armor: Shield, accessory: Gem, consumable: FlaskRound }
const SLOT_LABELS: Record<string, string> = { weapon: 'Weapons', armor: 'Armor', accessory: 'Accessories', consumable: 'Consumables' }

export default function ShopPage() {
    const { user, refreshProfile } = useUserStore()
    const [items, setItems] = useState<ShopItem[]>([])
    const [equipment, setEquipment] = useState<Equipment[]>([])
    const [ownedEquipment, setOwnedEquipment] = useState<Set<string>>(new Set())
    const [loading, setLoading] = useState(true)
    const [purchasing, setPurchasing] = useState<string | null>(null)
    const [equippedTitle, setEquippedTitle] = useState<string | null>(null)
    const [equippedFrame, setEquippedFrame] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState<Tab>('equipment')

    useEffect(() => {
        const init = async () => {
            const supabase = createClient()
            const { data: { session } } = await supabase.auth.getSession()
            if (!session?.user?.id) return

            const [shopItems, gear] = await Promise.all([
                fetchShopItems(session.user.id),
                fetchShopEquipment(),
            ])

            // Check which equipment user already owns
            const { data: userGear } = await (supabase as any)
                .from('user_equipment')
                .select('equipment_id')
                .eq('user_id', session.user.id)
            const ownedIds = new Set<string>((userGear || []).map((g: any) => g.equipment_id))

            setItems(shopItems as ShopItem[])
            setEquipment(gear as Equipment[])
            setOwnedEquipment(ownedIds)
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

    const handleBuyEquipment = async (eq: Equipment) => {
        if (!user || purchasing) return
        setPurchasing(eq.id)
        const result = await purchaseEquipment(user.id, eq.id, eq.cost)
        if (result.success) {
            setOwnedEquipment(prev => new Set([...prev, eq.id]))
            await refreshProfile()
        } else {
            alert(result.error || 'Purchase failed')
        }
        setPurchasing(null)
    }

    const balance = user?.iron_scraps || 0
    const titles = items.filter(i => i.type === 'title')
    const frames = items.filter(i => i.type === 'frame')
    const weapons = equipment.filter(e => e.slot === 'weapon')
    const armor = equipment.filter(e => e.slot === 'armor')
    const accessories = equipment.filter(e => e.slot === 'accessory')
    const consumables = equipment.filter(e => e.slot === 'consumable')

    const tabs: { id: Tab, label: string, icon: typeof ShoppingBag, count: number }[] = [
        { id: 'equipment', label: 'Gear', icon: Sword, count: weapons.length + armor.length + accessories.length },
        { id: 'consumables', label: 'Potions', icon: FlaskRound, count: consumables.length },
        { id: 'cosmetics', label: 'Cosmetics', icon: Sparkles, count: titles.length + frames.length },
    ]

    if (loading) {
        return (
            <div className="mx-auto max-w-5xl px-3 py-4 sm:p-4 md:p-8">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 w-48 bg-slate-800 rounded" />
                    <div className="h-12 w-full bg-slate-800/60 rounded-xl" />
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
        <div className="mx-auto max-w-5xl px-3 py-4 sm:p-4 md:p-8 space-y-5">
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
                    <span className="text-lg font-bold text-yellow-500">{balance.toLocaleString()}</span>
                </div>
            </div>

            {/* Tab Bar */}
            <div className="flex gap-1 bg-slate-900/60 border border-slate-800/60 rounded-xl p-1">
                {tabs.map(tab => {
                    const Icon = tab.icon
                    const isActive = activeTab === tab.id
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`relative flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all ${
                                isActive
                                    ? 'bg-indigo-500/20 text-indigo-400'
                                    : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/40'
                            }`}
                        >
                            <Icon className="w-4 h-4" />
                            <span className="hidden sm:inline">{tab.label}</span>
                            <span className="sm:hidden text-xs">{tab.label}</span>
                            <span className={`text-[10px] rounded-full px-1.5 py-0.5 ${isActive ? 'bg-indigo-500/30 text-indigo-300' : 'bg-slate-800 text-slate-500'}`}>
                                {tab.count}
                            </span>
                            {isActive && (
                                <motion.div
                                    layoutId="shop-tab"
                                    className="absolute inset-0 bg-indigo-500/10 border border-indigo-500/20 rounded-lg"
                                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                    style={{ zIndex: -1 }}
                                />
                            )}
                        </button>
                    )
                })}
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                >
                    {activeTab === 'equipment' && (
                        <div className="space-y-6">
                            {[
                                { label: 'Weapons', items: weapons, slotIcon: Sword },
                                { label: 'Armor', items: armor, slotIcon: Shield },
                                { label: 'Accessories', items: accessories, slotIcon: Gem },
                            ].map(section => (
                                <div key={section.label} className="space-y-3">
                                    <h2 className="text-xs uppercase tracking-widest font-bold text-slate-500 flex items-center gap-2 px-1">
                                        <section.slotIcon className="w-3.5 h-3.5" /> {section.label}
                                    </h2>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {section.items.map(eq => renderEquipmentCard(eq, balance, purchasing, ownedEquipment.has(eq.id), handleBuyEquipment))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'consumables' && (
                        <div className="space-y-3">
                            <h2 className="text-xs uppercase tracking-widest font-bold text-slate-500 flex items-center gap-2 px-1">
                                <FlaskRound className="w-3.5 h-3.5" /> Consumables
                            </h2>
                            <p className="text-xs text-slate-600 px-1">Single-use items. Can purchase multiples.</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {consumables.map(eq => renderEquipmentCard(eq, balance, purchasing, false, handleBuyEquipment))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'cosmetics' && (
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <h2 className="text-xs uppercase tracking-widest font-bold text-slate-500 flex items-center gap-2 px-1">
                                    <Crown className="w-3.5 h-3.5" /> Titles
                                </h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {titles.map(item => {
                                        const config = RARITY_CONFIG[item.rarity] || RARITY_CONFIG.common
                                        const RarityIcon = config.icon
                                        const isEquipped = equippedTitle === item.preview_value

                                        return (
                                            <Card key={item.id} className={`${config.border} ${config.glow} bg-slate-900/40 overflow-hidden`}>
                                                <CardContent className="p-4 space-y-3">
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-1.5">
                                                                <RarityIcon className={`w-4 h-4 flex-shrink-0 ${config.color}`} />
                                                                <h3 className={`font-bold text-sm truncate ${config.color}`}>{item.name}</h3>
                                                            </div>
                                                            <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{item.description}</p>
                                                        </div>
                                                        <span className={`text-[9px] uppercase tracking-wider font-bold ${config.color} ${config.bg} px-1.5 py-0.5 rounded-full flex-shrink-0 ml-2`}>
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
                                                            className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
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

                            <div className="space-y-3">
                                <h2 className="text-xs uppercase tracking-widest font-bold text-slate-500 flex items-center gap-2 px-1">
                                    <Package className="w-3.5 h-3.5" /> Portrait Frames
                                </h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {frames.map(item => {
                                        const config = RARITY_CONFIG[item.rarity] || RARITY_CONFIG.common
                                        const RarityIcon = config.icon
                                        const isEquipped = equippedFrame === item.preview_value

                                        return (
                                            <Card key={item.id} className={`${config.border} ${config.glow} bg-slate-900/40 overflow-hidden`}>
                                                <CardContent className="p-4 space-y-3">
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-1.5">
                                                                <RarityIcon className={`w-4 h-4 flex-shrink-0 ${config.color}`} />
                                                                <h3 className={`font-bold text-sm truncate ${config.color}`}>{item.name}</h3>
                                                            </div>
                                                            <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{item.description}</p>
                                                        </div>
                                                        <span className={`text-[9px] uppercase tracking-wider font-bold ${config.color} ${config.bg} px-1.5 py-0.5 rounded-full flex-shrink-0 ml-2`}>
                                                            {item.rarity}
                                                        </span>
                                                    </div>

                                                    <div className="flex justify-center">
                                                        <div className={`w-14 h-14 rounded-lg bg-slate-950 ${getFramePreview(item.preview_value)}`} />
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
                                                            className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
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
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    )
}

function renderEquipmentCard(
    eq: Equipment,
    balance: number,
    purchasing: string | null,
    owned: boolean,
    onBuy: (eq: Equipment) => void
) {
    const config = RARITY_CONFIG[eq.rarity] || RARITY_CONFIG.common
    const RarityIcon = config.icon

    return (
        <Card key={eq.id} className={`${config.border} ${config.glow} bg-slate-900/40 overflow-hidden`}>
            <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                            <RarityIcon className={`w-4 h-4 flex-shrink-0 ${config.color}`} />
                            <h3 className={`font-bold text-sm truncate ${config.color}`}>{eq.name}</h3>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{eq.description}</p>
                    </div>
                    <span className={`text-[9px] uppercase tracking-wider font-bold ${config.color} ${config.bg} px-1.5 py-0.5 rounded-full flex-shrink-0 ml-2`}>
                        {eq.rarity}
                    </span>
                </div>

                <div className={`text-[10px] uppercase tracking-wider font-mono ${config.color} ${config.bg} rounded-lg px-2 py-1 text-center`}>
                    {eq.slot}
                </div>

                {owned ? (
                    <Button variant="outline" className="w-full border-slate-700 text-slate-400" size="sm" disabled>
                        <Check className="w-4 h-4 mr-1" /> Owned
                    </Button>
                ) : (
                    <Button
                        onClick={() => onBuy(eq)}
                        disabled={balance < eq.cost || purchasing === eq.id}
                        className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
                        size="sm"
                    >
                        <Coins className="w-4 h-4 mr-1" />
                        {purchasing === eq.id ? 'Buying...' : `${eq.cost.toLocaleString()} Scraps`}
                    </Button>
                )}
            </CardContent>
        </Card>
    )
}

function getFramePreview(frame: string): string {
    switch (frame) {
        case 'bronze': return 'border-2 border-amber-700 shadow-[0_0_8px_rgba(180,83,9,0.4)]'
        case 'silver': return 'border-2 border-slate-400 shadow-[0_0_8px_rgba(148,163,184,0.4)]'
        case 'gold': return 'border-2 border-yellow-500 shadow-[0_0_12px_rgba(234,179,8,0.5)]'
        case 'flame': return 'border-2 border-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.5)]'
        case 'ice': return 'border-2 border-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.4)]'
        case 'shadow': return 'border-2 border-slate-600 shadow-[0_0_12px_rgba(30,30,30,0.8)]'
        case 'nature': return 'border-2 border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]'
        case 'lightning': return 'border-2 border-violet-400 shadow-[0_0_14px_rgba(167,139,250,0.5)]'
        case 'celestial': return 'border-2 border-indigo-400 shadow-[0_0_18px_rgba(129,140,248,0.6)]'
        case 'legendary': return 'border-2 border-purple-400 shadow-[0_0_16px_rgba(192,132,252,0.6)]'
        default: return 'border-2 border-slate-700'
    }
}
