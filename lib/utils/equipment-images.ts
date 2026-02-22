const SLOT_DIRECTORIES: Record<string, string> = {
    weapon: 'weapons',
    armor: 'armor',
    accessory: 'accessories',
    consumable: 'consumables',
}

export function getEquipmentImagePath(name: string, slot: string): string | null {
    const dir = SLOT_DIRECTORIES[slot]
    if (!dir) return null
    const filename = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    return `/items/${dir}/${filename}.png`
}
