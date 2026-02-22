"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Package, Sword, Shield, Gem, Sparkles, Crown, Star, Coins, Gift } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useUserStore } from "@/lib/store/user-store"
import { createClient } from "@/lib/supabase/client"
import { fetchUserEquipment, equipItem, unequipItem, fetchLootBoxes, openLootBox } from "@/lib/supabase/data-hooks"
import { getEquipmentImagePath } from "@/lib/utils/equipment-images"

const RARITY_CONFIG: Record<string, { color: string, bg: string, border: string, icon: typeof Star }> = {
    common: { color: 'text-slate-400', bg: 'bg-slate-400/10', border: 'border-slate-700', icon: Star },
    rare: { color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-500/30', icon: Gem },
    epic: { color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-500/30', icon: Sparkles },
    legendary: { color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-500/30', icon: Crown },
}

const SLOT_ICONS: Record<string, typeof Sword> = { weapon: Sword, armor: Shield, accessory: Gem }

interface Equipment { id: string; name: string; slot: string; rarity: string; effect_type: string; effect_value: number; effect_target: string | null; description: string; icon_name: string | null; cost: number | null }
interface UserEquipment { id: string; equipment_id: string; equipped_slot: string | null; equipment: Equipment }
interface LootBox { id: string; opened: boolean; source: string; loot_box_contents: { equipment: Equipment }[] }

export default function InventoryPage() {
    const { user, refreshProfile } = useUserStore()
    const [items, setItems] = useState<UserEquipment[]>([])
    const [lootBoxes, setLootBoxes] = useState<LootBox[]>([])
    const [loading, setLoading] = useState(true)
    const [openedItem, setOpenedItem] = useState<Equipment | null>(null)
    const [openingBoxId, setOpeningBoxId] = useState<string | null>(null)

    useEffect(() => {
        const init = async () => {
            const supabase = createClient()
            const { data: { session } } = await supabase.auth.getSession()
            if (!session?.user?.id) return
            const [eq, lb] = await Promise.all([
                fetchUserEquipment(session.user.id),
                fetchLootBoxes(session.user.id),
            ])
            setItems(eq as unknown as UserEquipment[])
            setLootBoxes(lb as unknown as LootBox[])
            setLoading(false)
        }
        init()
    }, [])

    const handleEquip = async (ue: UserEquipment) => {
        if (!user) return
        const slot = ue.equipment.slot
        const ok = await equipItem(user.id, ue.id, slot)
        if (ok) {
            setItems(prev => prev.map(i => {
                if (i.equipped_slot === slot) return { ...i, equipped_slot: null }
                if (i.id === ue.id) return { ...i, equipped_slot: slot }
                return i
            }))
        }
    }

    const handleUnequip = async (ue: UserEquipment) => {
        if (!user) return
        const ok = await unequipItem(user.id, ue.id)
        if (ok) setItems(prev => prev.map(i => i.id === ue.id ? { ...i, equipped_slot: null } : i))
    }

    const handleOpenLootBox = async (lb: LootBox) => {
        if (!user || openingBoxId) return
        setOpeningBoxId(lb.id)
        await new Promise(r => setTimeout(r, 600))
        const gear = await openLootBox(user.id, lb.id)
        setOpeningBoxId(null)
        if (gear) {
            setOpenedItem(gear)
            setLootBoxes(prev => prev.map(b => b.id === lb.id ? { ...b, opened: true } : b))
            const eq = await fetchUserEquipment(user.id)
            setItems(eq as unknown as UserEquipment[])
            await refreshProfile()
            setTimeout(() => setOpenedItem(null), 4000)
        }
    }

    const equipped = (slot: string) => items.find(i => i.equipped_slot === slot)
    const unopenedBoxes = lootBoxes.filter(b => !b.opened)

    if (loading) {
        return (
            <div className="mx-auto max-w-4xl px-3 py-4 sm:p-4 md:p-8">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 w-48 bg-slate-800 rounded" />
                    <div className="grid grid-cols-3 gap-3">
                        {[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-slate-800/60 rounded-xl" />)}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        {[...Array(4)].map((_, i) => <div key={i} className="h-40 bg-slate-800/60 rounded-xl" />)}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="mx-auto max-w-4xl px-3 py-4 sm:p-4 md:p-8 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2 font-cinzel">
                        <Package className="w-6 h-6 text-amber-400" /> Inventory
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">Manage your equipment and loot</p>
                </div>
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2 flex items-center gap-2">
                    <Coins className="w-5 h-5 text-yellow-500" />
                    <span className="text-lg font-bold text-yellow-500">{user?.iron_scraps || 0}</span>
                </div>
            </div>

            {/* Opened loot reveal */}
            <AnimatePresence>
                {openedItem && (
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        className={`relative rounded-xl border p-4 text-center overflow-hidden ${RARITY_CONFIG[openedItem.rarity]?.border || 'border-slate-700'} ${RARITY_CONFIG[openedItem.rarity]?.bg || ''}`}
                    >
                        <motion.div
                            initial={{ opacity: 0.8, scale: 1.2 }}
                            animate={{ opacity: 0, scale: 1.5 }}
                            transition={{ duration: 0.8 }}
                            className={`absolute inset-0 rounded-xl blur-xl ${
                                openedItem.rarity === 'legendary' ? 'bg-yellow-500/30' :
                                openedItem.rarity === 'epic' ? 'bg-purple-500/30' :
                                openedItem.rarity === 'rare' ? 'bg-blue-500/30' : 'bg-slate-500/20'
                            }`}
                        />
                        <p className="text-xs text-slate-400 uppercase tracking-wider mb-1 relative z-10 font-cinzel">You received</p>
                        <p className={`text-lg font-bold relative z-10 font-cinzel ${RARITY_CONFIG[openedItem.rarity]?.color || 'text-white'}`}>{openedItem.name}</p>
                        <p className="text-xs text-slate-400 mt-1 relative z-10">{openedItem.description}</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Equipment Slots */}
            <div className="space-y-3">
                <h2 className="text-[10px] uppercase tracking-widest font-semibold text-slate-500 px-1 font-cinzel">Equipped Gear</h2>
                <div className="grid grid-cols-3 gap-3">
                    {['weapon', 'armor', 'accessory'].map(slot => {
                        const eq = equipped(slot)
                        const SlotIcon = SLOT_ICONS[slot] || Star
                        const config = eq ? RARITY_CONFIG[eq.equipment.rarity] || RARITY_CONFIG.common : null
                        const imagePath = eq ? getEquipmentImagePath(eq.equipment.name, eq.equipment.slot) : null

                        return (
                            <Card key={slot} className={`${config?.border || 'border-slate-800'} bg-slate-900/40`}>
                                <CardContent className="p-3 text-center space-y-2">
                                    {eq && imagePath ? (
                                        <div className="w-12 h-12 mx-auto rounded-lg bg-slate-950/60 p-1 flex items-center justify-center">
                                            <img
                                                src={imagePath}
                                                alt={eq.equipment.name}
                                                className="w-full h-full object-contain"
                                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                                            />
                                        </div>
                                    ) : (
                                        <SlotIcon className={`w-5 h-5 mx-auto ${config?.color || 'text-slate-600'}`} />
                                    )}
                                    <p className="text-[10px] uppercase tracking-wider text-slate-500">{slot}</p>
                                    {eq ? (
                                        <>
                                            <p className={`text-sm font-bold ${config?.color || 'text-white'} truncate`}>{eq.equipment.name}</p>
                                            <p className="text-[10px] text-slate-400 truncate">{eq.equipment.description}</p>
                                            <Button size="sm" variant="outline" className="w-full border-slate-700 text-xs" onClick={() => handleUnequip(eq)}>
                                                Unequip
                                            </Button>
                                        </>
                                    ) : (
                                        <p className="text-xs text-slate-600">Empty</p>
                                    )}
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            </div>

            {/* Loot Boxes */}
            {unopenedBoxes.length > 0 && (
                <div className="space-y-3">
                    <h2 className="text-[10px] uppercase tracking-widest font-semibold text-slate-500 px-1 font-cinzel">Loot Boxes</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {unopenedBoxes.map(lb => (
                            <motion.div
                                key={lb.id}
                                animate={openingBoxId === lb.id ? { x: [0, -4, 4, -4, 4, -2, 2, 0] } : {}}
                                transition={{ duration: 0.5 }}
                            >
                                <Card className="border-yellow-500/30 bg-yellow-400/5">
                                    <CardContent className="p-4 text-center space-y-2">
                                        <Gift className="w-8 h-8 mx-auto text-yellow-400" />
                                        <p className="text-sm font-bold text-yellow-400 font-cinzel">Raid Loot Box</p>
                                        <Button size="sm" className="w-full bg-yellow-600 hover:bg-yellow-700 text-white" onClick={() => handleOpenLootBox(lb)}>
                                            Open
                                        </Button>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {/* Inventory Grid */}
            <div className="space-y-3">
                <h2 className="text-[10px] uppercase tracking-widest font-semibold text-slate-500 px-1 font-cinzel">All Equipment ({items.length})</h2>
                {items.length === 0 ? (
                    <Card className="border-slate-800 bg-slate-900/40">
                        <CardContent className="p-8 text-center">
                            <Package className="w-10 h-10 mx-auto text-slate-700 mb-2" />
                            <p className="text-sm text-slate-500">No equipment yet. Defeat raid bosses or visit the shop.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {items.map(ue => {
                            const eq = ue.equipment
                            const config = RARITY_CONFIG[eq.rarity] || RARITY_CONFIG.common
                            const RarityIcon = config.icon
                            const isEquipped = !!ue.equipped_slot
                            const imagePath = getEquipmentImagePath(eq.name, eq.slot)

                            return (
                                <Card key={ue.id} className={`${config.border} bg-slate-900/40 overflow-hidden`}>
                                    <CardContent className="p-4 space-y-3">
                                        <div className="flex items-start gap-3">
                                            {imagePath && (
                                                <div className={`w-14 h-14 shrink-0 rounded-lg bg-slate-950/60 border ${config.border} p-1 flex items-center justify-center`}>
                                                    <img
                                                        src={imagePath}
                                                        alt={eq.name}
                                                        className="w-full h-full object-contain"
                                                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                                                    />
                                                </div>
                                            )}
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-1.5">
                                                    <RarityIcon className={`w-4 h-4 shrink-0 ${config.color}`} />
                                                    <h3 className={`font-bold text-sm truncate ${config.color}`}>{eq.name}</h3>
                                                    <span className={`text-[9px] uppercase tracking-wider font-bold shrink-0 ml-auto ${config.color} ${config.bg} px-1.5 py-0.5 rounded-full`}>
                                                        {eq.rarity}
                                                    </span>
                                                </div>
                                                <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">{eq.slot}</p>
                                                <p className="text-xs text-slate-400 mt-1">{eq.description}</p>
                                            </div>
                                        </div>
                                        {isEquipped ? (
                                            <Button size="sm" className="w-full bg-indigo-600 hover:bg-indigo-700" onClick={() => handleUnequip(ue)}>
                                                Equipped - Tap to Remove
                                            </Button>
                                        ) : (
                                            <Button size="sm" variant="outline" className="w-full border-slate-700" onClick={() => handleEquip(ue)}>
                                                Equip
                                            </Button>
                                        )}
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
